import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../../common/prisma/prisma.service';

interface TimerTick {
  sessionId: string;
  elapsed: number;
  remaining: number;
  percent: number;
  phase: 'opening' | 'core' | 'closing' | 'overtime';
}

interface TimerMilestone {
  sessionId: string;
  percent: number;
  phase: 'closing' | 'overtime';
}

@WebSocketGateway({ namespace: '/ws/session', cors: { origin: '*' } })
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SessionGateway.name);

  /** Track connected client socket IDs per session room */
  private sessionParticipants: Map<string, Set<string>> = new Map();

  /** Track active interval timers per session */
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();

  /** Track which milestones have already been emitted per session */
  private emittedMilestones: Map<string, Set<number>> = new Map();

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove the client from every session room it was tracked in
    for (const [sessionId, participants] of this.sessionParticipants.entries()) {
      if (participants.delete(client.id)) {
        this.server.to(sessionId).emit('participant-left', {
          sessionId,
          participantCount: participants.size,
        });

        // Clean up empty sets
        if (participants.size === 0) {
          this.sessionParticipants.delete(sessionId);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Room management
  // ---------------------------------------------------------------------------

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ): Promise<void> {
    const { sessionId } = data;

    client.join(sessionId);

    if (!this.sessionParticipants.has(sessionId)) {
      this.sessionParticipants.set(sessionId, new Set());
    }
    this.sessionParticipants.get(sessionId)!.add(client.id);

    const participantCount = this.sessionParticipants.get(sessionId)!.size;

    this.logger.log(
      `Client ${client.id} joined room ${sessionId} (${participantCount} participant(s))`,
    );

    this.server.to(sessionId).emit('participant-joined', {
      sessionId,
      participantCount,
    });
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ): Promise<void> {
    const { sessionId } = data;

    client.leave(sessionId);

    const participants = this.sessionParticipants.get(sessionId);
    if (participants) {
      participants.delete(client.id);
      if (participants.size === 0) {
        this.sessionParticipants.delete(sessionId);
      }
    }

    const participantCount = participants?.size ?? 0;

    this.logger.log(
      `Client ${client.id} left room ${sessionId} (${participantCount} participant(s))`,
    );

    this.server.to(sessionId).emit('participant-left', {
      sessionId,
      participantCount,
    });
  }

  // ---------------------------------------------------------------------------
  // Session state transitions
  // ---------------------------------------------------------------------------

  @SubscribeMessage('session-start')
  async handleSessionStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ): Promise<void> {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionsService.transitionStatus(
        sessionId,
        userId,
        'IN_PROGRESS',
      );

      // Start the server-authoritative timer
      this.startTimer(sessionId, session.plannedDuration, session.startedAt!);

      this.server.to(sessionId).emit('session-state-update', {
        sessionId,
        status: 'IN_PROGRESS',
        startedAt: session.startedAt,
      });
    } catch (error) {
      client.emit('error', {
        event: 'session-start',
        message: error instanceof Error ? error.message : 'Failed to start session',
      });
    }
  }

  @SubscribeMessage('session-pause')
  async handleSessionPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ): Promise<void> {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionsService.transitionStatus(
        sessionId,
        userId,
        'PAUSED',
      );

      this.stopTimer(sessionId);

      this.server.to(sessionId).emit('session-state-update', {
        sessionId,
        status: 'PAUSED',
      });
    } catch (error) {
      client.emit('error', {
        event: 'session-pause',
        message: error instanceof Error ? error.message : 'Failed to pause session',
      });
    }
  }

  @SubscribeMessage('session-resume')
  async handleSessionResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ): Promise<void> {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionsService.transitionStatus(
        sessionId,
        userId,
        'IN_PROGRESS',
      );

      // Resume the timer from original startedAt so elapsed time stays accurate
      this.startTimer(sessionId, session.plannedDuration, session.startedAt!);

      this.server.to(sessionId).emit('session-state-update', {
        sessionId,
        status: 'IN_PROGRESS',
      });
    } catch (error) {
      client.emit('error', {
        event: 'session-resume',
        message: error instanceof Error ? error.message : 'Failed to resume session',
      });
    }
  }

  @SubscribeMessage('session-end')
  async handleSessionEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ): Promise<void> {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionsService.transitionStatus(
        sessionId,
        userId,
        'COMPLETED',
      );

      this.stopTimer(sessionId);

      this.server.to(sessionId).emit('session-state-update', {
        sessionId,
        status: 'COMPLETED',
        endedAt: session.endedAt,
        durationMinutes: session.durationMinutes,
      });
    } catch (error) {
      client.emit('error', {
        event: 'session-end',
        message: error instanceof Error ? error.message : 'Failed to end session',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Server-authoritative timer
  // ---------------------------------------------------------------------------

  private startTimer(
    sessionId: string,
    plannedDuration: number,
    startedAt: Date,
  ): void {
    // Clear any existing timer for this session before starting a new one
    this.stopTimer(sessionId);

    // Initialise the milestone tracking set for this session
    if (!this.emittedMilestones.has(sessionId)) {
      this.emittedMilestones.set(sessionId, new Set());
    }

    const totalSeconds = plannedDuration * 60;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      const remaining = Math.max(totalSeconds - elapsed, 0);
      const percent = (elapsed / totalSeconds) * 100;

      const phase = this.getPhase(percent);

      const tick: TimerTick = {
        sessionId,
        elapsed,
        remaining,
        percent: Math.round(percent * 100) / 100,
        phase,
      };

      this.server.to(sessionId).emit('timer-tick', tick);

      // Emit milestones at 80 %, 100 %, and 120 % thresholds (once each)
      this.checkMilestone(sessionId, percent, 80, 'closing');
      this.checkMilestone(sessionId, percent, 100, 'overtime');
      this.checkMilestone(sessionId, percent, 120, 'overtime');
    }, 1000);

    this.sessionTimers.set(sessionId, interval);
  }

  private stopTimer(sessionId: string): void {
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.sessionTimers.delete(sessionId);
    }
    this.emittedMilestones.delete(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getPhase(
    percent: number,
  ): 'opening' | 'core' | 'closing' | 'overtime' {
    if (percent > 100) return 'overtime';
    if (percent >= 90) return 'closing';
    if (percent >= 10) return 'core';
    return 'opening';
  }

  private checkMilestone(
    sessionId: string,
    currentPercent: number,
    threshold: number,
    phase: 'closing' | 'overtime',
  ): void {
    const emitted = this.emittedMilestones.get(sessionId);
    if (!emitted || emitted.has(threshold)) return;

    if (currentPercent >= threshold) {
      emitted.add(threshold);

      const milestone: TimerMilestone = {
        sessionId,
        percent: threshold,
        phase,
      };

      this.server.to(sessionId).emit('timer-milestone', milestone);
    }
  }
}
