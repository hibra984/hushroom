import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterCompanionDto } from './dto/register-companion.dto';
import { UpdateCompanionDto } from './dto/update-companion.dto';
import { SearchCompanionsDto } from './dto/search-companions.dto';

@Injectable()
export class CompanionsService {
  constructor(private readonly prisma: PrismaService) {}

  private decimalToNumber(value: Prisma.Decimal | number | string | null): number | null {
    if (value === null) return null;
    return Number(value);
  }

  private withNumericMetrics<
    T extends {
      baseRate: Prisma.Decimal | number | string;
      expertPremium: Prisma.Decimal | number | string | null;
      successRate: Prisma.Decimal | number | string;
      averageRating: Prisma.Decimal | number | string;
      reputationScore: Prisma.Decimal | number | string;
    },
  >(profile: T) {
    return {
      ...profile,
      baseRate: Number(profile.baseRate),
      expertPremium: this.decimalToNumber(profile.expertPremium),
      successRate: Number(profile.successRate),
      averageRating: Number(profile.averageRating),
      reputationScore: Number(profile.reputationScore),
    };
  }

  async register(userId: string, dto: RegisterCompanionDto) {
    const existing = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('User is already registered as a companion');
    }

    const [companionProfile] = await this.prisma.$transaction([
      this.prisma.companionProfile.create({
        data: {
          userId,
          bio: dto.bio,
          baseRate: dto.baseRate,
          expertiseTags: dto.expertiseTags ?? [],
          driftEnforcement: dto.driftEnforcement,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'COMPANION' },
      }),
    ]);

    return this.withNumericMetrics(companionProfile);
  }

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            preferredLanguage: true,
            timezone: true,
            role: true,
            isEmailVerified: true,
            isAgeVerified: true,
          },
        },
        availability: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Companion profile not found');
    }

    return this.withNumericMetrics(profile);
  }

  async updateProfile(userId: string, dto: UpdateCompanionDto) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Companion profile not found');
    }

    const updated = await this.prisma.companionProfile.update({
      where: { userId },
      data: {
        bio: dto.bio,
        baseRate: dto.baseRate,
        expertiseTags: dto.expertiseTags,
        driftEnforcement: dto.driftEnforcement,
        maxConcurrent: dto.maxConcurrent,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.withNumericMetrics(updated);
  }

  async getPublicProfile(companionId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
      select: {
        id: true,
        type: true,
        bio: true,
        baseRate: true,
        expertPremium: true,
        expertiseTags: true,
        totalSessions: true,
        successRate: true,
        averageRating: true,
        reputationScore: true,
        driftEnforcement: true,
        isOnline: true,
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            languagePreferences: {
              select: {
                language: true,
                proficiency: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Companion profile not found');
    }

    const { user, ...rest } = profile;

    return {
      ...this.withNumericMetrics(rest),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      languages: user.languagePreferences,
    };
  }

  async searchCompanions(filters: SearchCompanionsDto) {
    const where: Prisma.CompanionProfileWhereInput = {
      status: 'APPROVED',
      user: {
        isActive: true,
      },
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.minRating !== undefined) {
      where.averageRating = { gte: filters.minRating };
    }

    if (filters.language) {
      where.user = {
        ...where.user as Prisma.UserWhereInput,
        languagePreferences: {
          some: { language: filters.language },
        },
      };
    }

    if (filters.expertiseTag) {
      where.expertiseTags = { has: filters.expertiseTag };
    }

    if (filters.isOnline !== undefined) {
      where.isOnline = filters.isOnline;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.companionProfile.findMany({
        where,
        take: filters.take ?? 20,
        skip: filters.skip ?? 0,
        orderBy: [
          { isOnline: 'desc' },
          { reputationScore: 'desc' },
        ],
        select: {
          id: true,
          type: true,
          bio: true,
          baseRate: true,
          expertPremium: true,
          expertiseTags: true,
          totalSessions: true,
          successRate: true,
          averageRating: true,
          reputationScore: true,
          driftEnforcement: true,
          isOnline: true,
          user: {
            select: {
              displayName: true,
              avatarUrl: true,
              languagePreferences: {
                select: {
                  language: true,
                  proficiency: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.companionProfile.count({ where }),
    ]);

    const companions = data.map(({ user, ...rest }) => ({
      ...this.withNumericMetrics(rest),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      languages: user.languagePreferences,
    }));

    return {
      data: companions,
      total,
      take: filters.take ?? 20,
      skip: filters.skip ?? 0,
    };
  }

  async toggleOnline(userId: string, isOnline: boolean) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Companion profile not found');
    }

    return this.prisma.companionProfile.update({
      where: { userId },
      data: {
        isOnline,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        isOnline: true,
        lastActiveAt: true,
      },
    });
  }
}
