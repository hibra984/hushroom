import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

const REPUTATION_WEIGHTS = {
  overallScore: 0.3,
  goalAchievement: 0.25,
  presenceQuality: 0.25,
  contractAdherence: 0.15,
  communication: 0.05,
};

const FULL_CONFIDENCE_THRESHOLD = 20;
const DECAY_RATE = 0.005; // 0.5% per day
const RATING_WINDOW_HOURS = 48;

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRating(raterId: string, dto: CreateRatingDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      include: { companion: true },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'COMPLETED')
      throw new BadRequestException('Can only rate completed sessions');

    // Verify the rater is a participant
    const isUser = session.userId === raterId;
    const isCompanion = session.companion?.userId === raterId;
    if (!isUser && !isCompanion)
      throw new ForbiddenException('You are not a participant of this session');

    // Check 48h rating window
    if (session.endedAt) {
      const windowEnd = new Date(
        session.endedAt.getTime() + RATING_WINDOW_HOURS * 60 * 60 * 1000,
      );
      if (new Date() > windowEnd)
        throw new BadRequestException(
          'Rating window has expired (48 hours after session end)',
        );
    }

    // Check for duplicate
    const existing = await this.prisma.rating.findUnique({
      where: {
        sessionId_raterId: { sessionId: dto.sessionId, raterId },
      },
    });
    if (existing)
      throw new BadRequestException('You have already rated this session');

    // Determine who is being rated
    const ratedUserId = isUser ? session.companion!.userId : session.userId;

    const rating = await this.prisma.rating.create({
      data: {
        sessionId: dto.sessionId,
        raterId,
        ratedUserId,
        overallScore: dto.overallScore,
        goalAchievement: dto.goalAchievement,
        presenceQuality: dto.presenceQuality,
        contractAdherence: dto.contractAdherence,
        communication: dto.communication,
        comment: dto.comment,
        isPublic: dto.isPublic ?? false,
      },
    });

    // If the rated user is a companion, update their reputation
    const companionProfile = await this.prisma.companionProfile.findUnique({
      where: { userId: ratedUserId },
    });
    if (companionProfile) {
      await this.updateCompanionReputation(companionProfile.id);
    }

    return rating;
  }

  async getRatingsBySession(sessionId: string) {
    return this.prisma.rating.findMany({
      where: { sessionId },
      include: {
        rater: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        ratedUser: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async getCompanionRatings(companionId: string, page = 1, limit = 20) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
    });
    if (!companion) throw new NotFoundException('Companion not found');

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { ratedUserId: companion.userId, isPublic: true },
        include: {
          rater: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
          session: { include: { goal: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rating.count({
        where: { ratedUserId: companion.userId, isPublic: true },
      }),
    ]);

    return {
      ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyRatings(userId: string) {
    const [given, received] = await Promise.all([
      this.prisma.rating.findMany({
        where: { raterId: userId },
        include: {
          session: { include: { goal: { select: { title: true } } } },
          ratedUser: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.findMany({
        where: { ratedUserId: userId },
        include: {
          session: { include: { goal: { select: { title: true } } } },
          rater: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { given, received };
  }

  async updateCompanionReputation(companionId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
    });
    if (!companion) return;

    const ratings = await this.prisma.rating.findMany({
      where: { ratedUserId: companion.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (ratings.length === 0) return;

    // Calculate weighted average with recency bias
    let weightedSum = 0;
    let totalWeight = 0;
    const now = Date.now();

    for (const r of ratings) {
      // Recency factor: more recent = higher weight
      const daysSince =
        (now - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.exp(-0.01 * daysSince); // exponential decay

      const dimensionScore =
        r.overallScore * REPUTATION_WEIGHTS.overallScore +
        (r.goalAchievement ?? r.overallScore) *
          REPUTATION_WEIGHTS.goalAchievement +
        (r.presenceQuality ?? r.overallScore) *
          REPUTATION_WEIGHTS.presenceQuality +
        (r.contractAdherence ?? r.overallScore) *
          REPUTATION_WEIGHTS.contractAdherence +
        (r.communication ?? r.overallScore) *
          REPUTATION_WEIGHTS.communication;

      weightedSum += dimensionScore * recencyWeight;
      totalWeight += recencyWeight;
    }

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Volume confidence: scale up to full confidence at FULL_CONFIDENCE_THRESHOLD ratings
    const confidence = Math.min(
      ratings.length / FULL_CONFIDENCE_THRESHOLD,
      1,
    );
    const reputationScore =
      Math.round(rawScore * confidence * 100) / 100;

    // Simple average for display
    const averageRating =
      Math.round(
        (ratings.reduce((sum, r) => sum + r.overallScore, 0) /
          ratings.length) *
          100,
      ) / 100;

    // Success rate
    const completedSessions = await this.prisma.session.count({
      where: { companionId, status: 'COMPLETED' },
    });
    const achievedGoals = await this.prisma.session.count({
      where: {
        companionId,
        status: 'COMPLETED',
        goal: { isAchieved: true },
      },
    });
    const successRate =
      completedSessions > 0
        ? Math.round((achievedGoals / completedSessions) * 10000) / 100
        : 0;

    await this.prisma.companionProfile.update({
      where: { id: companionId },
      data: {
        averageRating,
        reputationScore,
        successRate,
        totalSessions: completedSessions,
      },
    });
  }

  /**
   * Reputation decay: called by cron daily.
   * Reduces reputation by DECAY_RATE for companions inactive > 30 days.
   */
  async applyReputationDecay() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactiveCompanions = await this.prisma.companionProfile.findMany({
      where: {
        lastActiveAt: { lt: thirtyDaysAgo },
        reputationScore: { gt: 0 },
      },
    });

    for (const companion of inactiveCompanions) {
      const currentScore = Number(companion.reputationScore);
      const newScore = Math.max(
        0,
        Math.round(currentScore * (1 - DECAY_RATE) * 100) / 100,
      );

      await this.prisma.companionProfile.update({
        where: { id: companion.id },
        data: { reputationScore: newScore },
      });
    }

    return { processed: inactiveCompanions.length };
  }
}
