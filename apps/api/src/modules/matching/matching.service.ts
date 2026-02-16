import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EmailService } from '../../common/email/email.service';
import { FindMatchDto } from './dto/find-match.dto';
import { SelectCompanionDto } from './dto/select-companion.dto';
import { validateTransition } from '../sessions/session-state.machine';

export interface ScoredCompanion {
  companionId: string;
  displayName: string | null;
  avatarUrl: string | null;
  type: string;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  averageRating: number;
  reputationScore: number;
  totalSessions: number;
  successRate: number;
  isOnline: boolean;
  languages: { language: string; proficiency: string }[];
  score: number;
  breakdown: {
    goalMatch: number;
    reputation: number;
    fairDistribution: number;
    priceFit: number;
  };
}

const SCORING_WEIGHTS = {
  goalMatch: 0.35,
  reputation: 0.3,
  fairDistribution: 0.2,
  priceFit: 0.15,
};

const RECENT_SESSION_WINDOW_DAYS = 7;
const FAIR_DISTRIBUTION_KEY_PREFIX = 'matching:recent_sessions:';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async findMatches(userId: string, dto: FindMatchDto): Promise<ScoredCompanion[]> {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      include: { goal: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    if (session.status !== 'PENDING_MATCH') {
      throw new BadRequestException('Session is not in PENDING_MATCH status');
    }

    // Step 1: Filter pipeline — get eligible companions
    const candidates = await this.getEligibleCompanions(dto);

    if (candidates.length === 0) {
      return [];
    }

    // Step 2: Get fair distribution data from Redis
    const recentSessionCounts = await this.getRecentSessionCounts(
      candidates.map((c) => c.id),
    );

    // Step 3: Score each candidate
    const goalKeywords = session.goal?.keywords ?? [];
    const maxRecentSessions = Math.max(...Object.values(recentSessionCounts), 1);

    const scored = candidates.map((companion) => {
      const goalMatch = this.calculateGoalMatch(
        goalKeywords,
        companion.expertiseTags,
      );

      const reputation = this.calculateReputation(
        Number(companion.averageRating),
        Number(companion.successRate),
        Number(companion.reputationScore),
      );

      const recentCount = recentSessionCounts[companion.id] ?? 0;
      const fairDistribution = this.calculateFairDistribution(
        recentCount,
        maxRecentSessions,
      );

      const priceFit = this.calculatePriceFit(
        Number(companion.baseRate),
        Number(companion.expertPremium ?? 0),
        dto.maxPrice,
      );

      const totalScore =
        goalMatch * SCORING_WEIGHTS.goalMatch +
        reputation * SCORING_WEIGHTS.reputation +
        fairDistribution * SCORING_WEIGHTS.fairDistribution +
        priceFit * SCORING_WEIGHTS.priceFit;

      return {
        companionId: companion.id,
        displayName: companion.user.displayName,
        avatarUrl: companion.user.avatarUrl,
        type: companion.type,
        bio: companion.bio,
        baseRate: Number(companion.baseRate),
        expertPremium: companion.expertPremium ? Number(companion.expertPremium) : null,
        expertiseTags: companion.expertiseTags,
        averageRating: Number(companion.averageRating),
        reputationScore: Number(companion.reputationScore),
        totalSessions: companion.totalSessions,
        successRate: Number(companion.successRate),
        isOnline: companion.isOnline,
        languages: companion.user.languagePreferences.map((lp) => ({
          language: lp.language,
          proficiency: lp.proficiency,
        })),
        score: Math.round(totalScore * 100) / 100,
        breakdown: {
          goalMatch: Math.round(goalMatch * 100) / 100,
          reputation: Math.round(reputation * 100) / 100,
          fairDistribution: Math.round(fairDistribution * 100) / 100,
          priceFit: Math.round(priceFit * 100) / 100,
        },
      };
    });

    // Step 4: Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Cache results in Redis for retrieval
    await this.redis.set(
      `matching:results:${dto.sessionId}`,
      JSON.stringify(scored),
      'EX',
      3600,
    );

    return scored;
  }

  async getResults(sessionId: string): Promise<ScoredCompanion[]> {
    const cached = await this.redis.get(`matching:results:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return [];
  }

  async selectCompanion(userId: string, dto: SelectCompanionDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    validateTransition(session.status, 'MATCHED');

    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: dto.companionId },
    });

    if (!companion) {
      throw new NotFoundException('Companion not found');
    }

    const activeCount = await this.prisma.session.count({
      where: {
        companionId: dto.companionId,
        status: { in: ['MATCHED', 'PAYMENT_AUTHORIZED', 'READY', 'IN_PROGRESS'] },
      },
    });

    if (activeCount >= companion.maxConcurrent) {
      throw new BadRequestException('Companion has reached maximum concurrent sessions');
    }

    const updated = await this.prisma.session.update({
      where: { id: dto.sessionId },
      data: {
        companionId: dto.companionId,
        status: 'MATCHED',
      },
      include: {
        goal: true,
        contract: true,
        companion: {
          include: {
            user: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Increment recent session count for fair distribution
    const key = `${FAIR_DISTRIBUTION_KEY_PREFIX}${dto.companionId}`;
    await this.redis.incr(key);
    await this.redis.expire(key, RECENT_SESSION_WINDOW_DAYS * 86400);

    await this.redis.del(`matching:results:${dto.sessionId}`);

    // Send booking confirmation email to the user
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const sessionWithGoal = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      include: { goal: true },
    });
    if (user?.email) {
      this.emailService.sendSessionBooked(user.email, {
        goalTitle: sessionWithGoal?.goal?.title ?? 'Session',
        companionName: updated.companion?.user?.displayName ?? 'Your companion',
        scheduledAt: updated.scheduledAt?.toISOString() ?? 'To be scheduled',
      }).catch(() => {});
    }

    return updated;
  }

  private async getEligibleCompanions(dto: FindMatchDto) {
    const where: any = {
      status: 'APPROVED',
      user: { isActive: true },
    };

    if (dto.onlineOnly) {
      where.isOnline = true;
    }

    if (dto.language) {
      where.user = {
        ...where.user,
        languagePreferences: {
          some: { language: dto.language },
        },
      };
    }

    if (dto.expertiseTag) {
      where.expertiseTags = { has: dto.expertiseTag };
    }

    if (dto.maxPrice !== undefined) {
      where.baseRate = { lte: dto.maxPrice };
    }

    return this.prisma.companionProfile.findMany({
      where,
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            languagePreferences: {
              select: { language: true, proficiency: true },
            },
          },
        },
        availability: {
          where: { isBlocked: false },
        },
      },
      take: 50,
    });
  }

  private calculateGoalMatch(goalKeywords: string[], expertiseTags: string[]): number {
    if (goalKeywords.length === 0 || expertiseTags.length === 0) {
      return 0.5;
    }

    const normalizedKeywords = goalKeywords.map((k) => k.toLowerCase());
    const normalizedTags = expertiseTags.map((t) => t.toLowerCase());

    let matches = 0;
    for (const keyword of normalizedKeywords) {
      if (normalizedTags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) {
        matches++;
      }
    }

    return Math.min(matches / Math.max(normalizedKeywords.length, 1), 1);
  }

  private calculateReputation(avgRating: number, successRate: number, reputationScore: number): number {
    const normalizedRating = avgRating / 5;
    const normalizedSuccess = successRate / 100;
    const normalizedReputation = reputationScore / 100;

    return normalizedRating * 0.4 + normalizedSuccess * 0.3 + normalizedReputation * 0.3;
  }

  private calculateFairDistribution(recentCount: number, maxRecentSessions: number): number {
    if (maxRecentSessions === 0) return 1;
    return 1 - recentCount / (maxRecentSessions + 1);
  }

  private calculatePriceFit(baseRate: number, expertPremium: number, maxPrice?: number): number {
    if (!maxPrice) return 0.5;
    const totalRate = baseRate + expertPremium;
    if (totalRate > maxPrice) return 0;
    return 1 - totalRate / maxPrice;
  }

  private async getRecentSessionCounts(companionIds: string[]): Promise<Record<string, number>> {
    const pipeline = this.redis.pipeline();
    for (const id of companionIds) {
      pipeline.get(`${FAIR_DISTRIBUTION_KEY_PREFIX}${id}`);
    }

    const results = await pipeline.exec();
    const counts: Record<string, number> = {};

    if (results) {
      for (let i = 0; i < companionIds.length; i++) {
        const [, value] = results[i] ?? [];
        counts[companionIds[i]] = parseInt(value as string, 10) || 0;
      }
    }

    return counts;
  }
}
