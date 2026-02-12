export interface Rating {
  id: string;
  sessionId: string;
  raterId: string;
  ratedUserId: string;
  overallScore: number;
  goalAchievement: number | null;
  presenceQuality: number | null;
  contractAdherence: number | null;
  communication: number | null;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateRatingDto {
  sessionId: string;
  overallScore: number;
  goalAchievement?: number;
  presenceQuality?: number;
  contractAdherence?: number;
  communication?: number;
  comment?: string;
  isPublic?: boolean;
}

export const REPUTATION_WEIGHTS = {
  overallScore: 0.3,
  goalAchievement: 0.25,
  presenceQuality: 0.25,
  contractAdherence: 0.15,
  communication: 0.05,
} as const;
