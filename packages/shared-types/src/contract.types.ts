import { ContractMode, SessionType } from './enums';

export interface ContractRule {
  type: string;
  description?: string;
  maxMinutes?: number;
  topics?: string[];
}

export interface Contract {
  id: string;
  sessionId: string;
  templateId: string | null;
  mode: ContractMode;
  rules: ContractRule[];
  acceptedByUser: boolean;
  acceptedByCompanion: boolean;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  sessionType: SessionType;
  mode: ContractMode;
  rules: ContractRule[];
  isActive: boolean;
}

export interface CreateContractDto {
  sessionId: string;
  templateId?: string;
  mode: ContractMode;
  rules?: ContractRule[];
}
