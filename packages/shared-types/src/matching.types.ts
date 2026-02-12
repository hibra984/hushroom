import { CompanionPublicProfile } from './companion.types';

export interface MatchScore {
  companionId: string;
  goalMatchScore: number;
  reputationScore: number;
  fairDistributionWeight: number;
  priceFitScore: number;
  totalScore: number;
}

export interface MatchResult {
  companion: CompanionPublicProfile;
  score: MatchScore;
}

export interface FindMatchesDto {
  sessionId: string;
  language?: string;
  preferredGender?: string;
  maxPrice?: number;
  requireExpert?: boolean;
}

export interface SelectMatchDto {
  sessionId: string;
  companionId: string;
}

export const MATCH_WEIGHTS = {
  goalMatch: 0.35,
  reputation: 0.3,
  fairDistribution: 0.2,
  priceFit: 0.15,
} as const;
