import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Users ----

  async getUsers(page = 1, limit = 20, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUser(userId: string, data: { isActive?: boolean; role?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;
    return this.prisma.user.update({ where: { id: userId }, data: updateData });
  }

  // ---- Companions ----

  async getPendingCompanions() {
    return this.prisma.companionProfile.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveCompanion(companionId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
    });
    if (!companion) throw new NotFoundException('Companion not found');
    if (companion.status !== 'PENDING_REVIEW')
      throw new BadRequestException('Companion is not pending review');
    return this.prisma.companionProfile.update({
      where: { id: companionId },
      data: { status: 'APPROVED' },
    });
  }

  async suspendCompanion(companionId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionId },
    });
    if (!companion) throw new NotFoundException('Companion not found');
    return this.prisma.companionProfile.update({
      where: { id: companionId },
      data: { status: 'SUSPENDED', isOnline: false },
    });
  }

  // ---- Sessions ----

  async getSessions(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          companion: {
            include: { user: { select: { displayName: true } } },
          },
          goal: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);
    return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---- Payments ----

  async getPayments(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          session: {
            include: {
              user: { select: { displayName: true } },
              goal: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---- Abuse Reports ----

  async createAbuseReport(
    reporterId: string,
    data: {
      reportedUserId: string;
      sessionId?: string;
      reason: string;
      description: string;
    },
  ) {
    const report = await this.prisma.abuseReport.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        sessionId: data.sessionId,
        reason: data.reason,
        description: data.description,
      },
    });

    // Auto-suspend check
    await this.checkAutoSuspend(data.reportedUserId);
    return report;
  }

  async getAbuseReports(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [reports, total] = await Promise.all([
      this.prisma.abuseReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.abuseReport.count({ where }),
    ]);
    return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveAbuseReport(reportId: string, adminNotes: string) {
    const report = await this.prisma.abuseReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.abuseReport.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', adminNotes, resolvedAt: new Date() },
    });
  }

  async dismissAbuseReport(reportId: string, adminNotes: string) {
    const report = await this.prisma.abuseReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.abuseReport.update({
      where: { id: reportId },
      data: { status: 'DISMISSED', adminNotes, resolvedAt: new Date() },
    });
  }

  async checkAutoSuspend(reportedUserId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReports = await this.prisma.abuseReport.count({
      where: {
        reportedUserId,
        status: 'PENDING',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    if (recentReports >= 3) {
      await this.prisma.user.update({
        where: { id: reportedUserId },
        data: { isActive: false },
      });
      const companion = await this.prisma.companionProfile.findUnique({
        where: { userId: reportedUserId },
      });
      if (companion) {
        await this.prisma.companionProfile.update({
          where: { id: companion.id },
          data: { status: 'SUSPENDED', isOnline: false },
        });
      }
      return true;
    }
    return false;
  }

  // ---- Audit Logs ----

  async getAuditLogs(page = 1, limit = 50, userId?: string, action?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---- Platform Stats ----

  async getPlatformStats() {
    const [
      totalUsers,
      totalCompanions,
      totalSessions,
      completedSessions,
      totalPayments,
      totalRevenue,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.companionProfile.count({ where: { status: 'APPROVED' } }),
      this.prisma.session.count(),
      this.prisma.session.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'CAPTURED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED' },
        _sum: { platformFee: true },
      }),
      this.prisma.abuseReport.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalCompanions,
      totalSessions,
      completedSessions,
      totalPayments,
      totalRevenue: Number(totalRevenue._sum.platformFee ?? 0),
      pendingReports,
    };
  }
}
