import { BadRequestException } from '@nestjs/common';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_MATCH: ['MATCHED', 'CANCELLED'],
  MATCHED: ['PAYMENT_AUTHORIZED', 'CANCELLED'],
  PAYMENT_AUTHORIZED: ['READY', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PAUSED', 'COMPLETED', 'ABANDONED'],
  PAUSED: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  ABANDONED: [],
  DISPUTED: ['COMPLETED'],
};

export function validateTransition(from: string, to: string): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) {
    throw new BadRequestException(`Unknown session status: ${from}`);
  }
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid transition from ${from} to ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }
}

export function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export function getAllowedTransitions(from: string): string[] {
  return VALID_TRANSITIONS[from] ?? [];
}
