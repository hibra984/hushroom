import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { LanguagePreferenceDto } from './dto/update-languages.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        languagePreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.preferredLanguage !== undefined && { preferredLanguage: dto.preferredLanguage }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
      include: {
        languagePreferences: true,
      },
    });

    const { passwordHash, ...profile } = updated;
    return profile;
  }

  async getLanguages(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.languagePreference.findMany({
      where: { userId },
    });
  }

  async updateLanguages(userId: string, languages: LanguagePreferenceDto[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.languagePreference.deleteMany({
        where: { userId },
      });

      const created = await Promise.all(
        languages.map((lang) =>
          tx.languagePreference.create({
            data: {
              userId,
              language: lang.language,
              proficiency: lang.proficiency,
              isPreferred: lang.isPreferred,
            },
          }),
        ),
      );

      return created;
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });

    return { message: 'Account deleted successfully' };
  }

  async requestDataExport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      languagePreferences,
      sessions,
      ratingsGiven,
      ratingsReceived,
      payments,
      auditLogs,
    ] = await Promise.all([
      this.prisma.languagePreference.findMany({ where: { userId } }),
      this.prisma.session.findMany({
        where: { userId },
        include: {
          goal: true,
          contract: true,
          driftLogs: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.findMany({
        where: { raterId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rating.findMany({
        where: { ratedUserId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const { passwordHash, ...profile } = user;

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT',
        entityType: 'User',
        entityId: userId,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      profile,
      languagePreferences,
      sessions: sessions.map((s) => ({
        id: s.id,
        type: s.type,
        status: s.status,
        plannedDuration: s.plannedDuration,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationMinutes: s.durationMinutes,
        scheduledAt: s.scheduledAt,
        createdAt: s.createdAt,
        goal: s.goal,
        contract: s.contract ? {
          mode: s.contract.mode,
          rules: s.contract.rules,
          acceptedByUser: s.contract.acceptedByUser,
          acceptedByCompanion: s.contract.acceptedByCompanion,
          acceptedAt: s.contract.acceptedAt,
        } : null,
        driftLogs: s.driftLogs,
      })),
      ratingsGiven,
      ratingsReceived,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        authorizedAt: p.authorizedAt,
        capturedAt: p.capturedAt,
        refundedAt: p.refundedAt,
        refundAmount: p.refundAmount,
        createdAt: p.createdAt,
      })),
      auditLogs: auditLogs.map((a) => ({
        action: a.action,
        entityType: a.entityType,
        timestamp: a.timestamp,
      })),
    };
  }
}
