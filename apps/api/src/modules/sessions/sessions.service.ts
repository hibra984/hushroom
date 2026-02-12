import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { validateTransition } from './session-state.machine';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSessionDto) {
    const session = await this.prisma.session.create({
      data: {
        userId,
        type: dto.type,
        status: 'PENDING_MATCH',
        plannedDuration: dto.plannedDuration ?? 30,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_CREATE',
        entityType: 'Session',
        entityId: session.id,
      },
    });

    return session;
  }

  async findById(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        goal: true,
        contract: true,
        companion: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    return session;
  }

  async findByUser(userId: string, status?: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        goal: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCompanion(companionId: string, status?: string) {
    return this.prisma.session.findMany({
      where: {
        companionId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        goal: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async transitionStatus(
    sessionId: string,
    userId: string,
    newStatus: string,
    extra?: { cancellationReason?: string },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { companion: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Verify the user is the session owner or the companion
    const isOwner = session.userId === userId;
    const isCompanion = session.companion?.userId === userId;

    if (!isOwner && !isCompanion) {
      throw new ForbiddenException('You are not a participant of this session');
    }

    validateTransition(session.status, newStatus);

    const updateData: Record<string, any> = {
      status: newStatus,
    };

    if (newStatus === 'IN_PROGRESS' && !session.startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === 'COMPLETED' || newStatus === 'ABANDONED') {
      updateData.endedAt = new Date();
      if (session.startedAt) {
        updateData.durationMinutes = Math.round(
          (Date.now() - session.startedAt.getTime()) / 60_000,
        );
      }
    }

    if (newStatus === 'CANCELLED' && extra?.cancellationReason) {
      updateData.cancellationReason = extra.cancellationReason;
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });
  }
}
