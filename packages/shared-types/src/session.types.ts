import { SessionStatus, SessionType } from './enums';

export interface Session {
  id: string;
  userId: string;
  companionId: string | null;
  type: SessionType;
  status: SessionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  plannedDuration: number;
  livekitRoomName: string | null;
  metadata: Record<string, unknown> | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  type: SessionType;
  plannedDuration: number;
  scheduledAt?: string;
}

export interface SessionWithDetails extends Session {
  goal: import('./goal.types').Goal | null;
  contract: import('./contract.types').Contract | null;
  companion: import('./companion.types').CompanionPublicProfile | null;
}

export const SESSION_VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.PENDING_MATCH]: [SessionStatus.MATCHED, SessionStatus.CANCELLED],
  [SessionStatus.MATCHED]: [SessionStatus.PAYMENT_AUTHORIZED, SessionStatus.CANCELLED],
  [SessionStatus.PAYMENT_AUTHORIZED]: [SessionStatus.READY, SessionStatus.CANCELLED],
  [SessionStatus.READY]: [SessionStatus.IN_PROGRESS, SessionStatus.CANCELLED],
  [SessionStatus.IN_PROGRESS]: [
    SessionStatus.PAUSED,
    SessionStatus.COMPLETED,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.PAUSED]: [SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED],
  [SessionStatus.COMPLETED]: [SessionStatus.DISPUTED],
  [SessionStatus.CANCELLED]: [],
  [SessionStatus.ABANDONED]: [],
  [SessionStatus.DISPUTED]: [SessionStatus.COMPLETED],
};
