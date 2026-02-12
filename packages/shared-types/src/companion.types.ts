import { CompanionStatus, CompanionType, ContractMode } from './enums';

export interface CompanionProfile {
  id: string;
  userId: string;
  type: CompanionType;
  status: CompanionStatus;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  certifications: Record<string, unknown> | null;
  identityVerified: boolean;
  totalSessions: number;
  successRate: number;
  averageRating: number;
  reputationScore: number;
  driftEnforcement: ContractMode;
  maxConcurrent: number;
  isOnline: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanionPublicProfile {
  id: string;
  displayName: string | null;
  type: CompanionType;
  bio: string | null;
  baseRate: number;
  expertPremium: number | null;
  expertiseTags: string[];
  totalSessions: number;
  successRate: number;
  averageRating: number;
  reputationScore: number;
  driftEnforcement: ContractMode;
  isOnline: boolean;
  languages: { language: string; proficiency: string }[];
}

export interface RegisterCompanionDto {
  bio?: string;
  baseRate: number;
  expertiseTags?: string[];
  driftEnforcement?: ContractMode;
  type?: CompanionType;
}
