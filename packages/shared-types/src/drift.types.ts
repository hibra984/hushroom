import { DriftSeverity } from './enums';

export interface DriftLog {
  id: string;
  sessionId: string;
  severity: DriftSeverity;
  message: string;
  triggerType: 'keyword' | 'timer' | 'manual' | 'pattern';
  triggerData: Record<string, unknown> | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  timestamp: string;
}

export interface DriftAlertEvent {
  sessionId: string;
  driftLogId: string;
  severity: DriftSeverity;
  message: string;
  triggerType: string;
}

export interface DriftAcknowledgeEvent {
  sessionId: string;
  driftLogId: string;
}

export interface CompanionDriftFlagEvent {
  sessionId: string;
  reason: string;
}

export const DRIFT_THRESHOLDS = {
  lowCount: 1,
  mediumCount: 2,
  highCount: 4,
  timerWarningPercent: 80,
  timerOverPercent: 100,
  timerCriticalPercent: 120,
} as const;
