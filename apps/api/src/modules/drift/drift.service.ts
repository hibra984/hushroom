import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DriftSeverity } from '@prisma/client';

const SEVERITY_ORDER: DriftSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Injectable()
export class DriftService {
  constructor(private readonly prisma: PrismaService) {}

  async createDriftAlert(
    sessionId: string,
    data: {
      severity: string;
      message: string;
      triggerType: string;
      triggerData?: any;
    },
  ) {
    return this.prisma.driftLog.create({
      data: {
        sessionId,
        severity: data.severity as DriftSeverity,
        message: data.message,
        triggerType: data.triggerType,
        triggerData: data.triggerData ?? undefined,
      },
    });
  }

  async acknowledgeDrift(driftLogId: string, userId: string) {
    return this.prisma.driftLog.update({
      where: { id: driftLogId },
      data: {
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async getDriftLogs(sessionId: string) {
    return this.prisma.driftLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getUnacknowledgedDrifts(sessionId: string) {
    return this.prisma.driftLog.findMany({
      where: {
        sessionId,
        acknowledgedAt: null,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  escalateSeverity(currentSeverity: string): DriftSeverity {
    const index = SEVERITY_ORDER.indexOf(currentSeverity as DriftSeverity);

    if (index === -1 || index >= SEVERITY_ORDER.length - 1) {
      return 'CRITICAL';
    }

    return SEVERITY_ORDER[index + 1];
  }

  checkTimerDrift(
    sessionId: string,
    elapsedPercent: number,
  ): { severity: string; message: string; triggerType: string; triggerData: any } | null {
    if (elapsedPercent >= 120) {
      return {
        severity: 'HIGH',
        message: 'Session running 20% over planned time',
        triggerType: 'timer',
        triggerData: { sessionId, elapsedPercent },
      };
    }

    if (elapsedPercent >= 100) {
      return {
        severity: 'MEDIUM',
        message: 'Planned duration reached',
        triggerType: 'timer',
        triggerData: { sessionId, elapsedPercent },
      };
    }

    if (elapsedPercent >= 80) {
      return {
        severity: 'LOW',
        message: 'Session is 80% complete',
        triggerType: 'timer',
        triggerData: { sessionId, elapsedPercent },
      };
    }

    return null;
  }
}
