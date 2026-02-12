import { UserRole } from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  dateOfBirth: string;
  role: UserRole;
  isEmailVerified: boolean;
  isAgeVerified: boolean;
  avatarUrl: string | null;
  preferredLanguage: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  timezone: string;
  role: UserRole;
  languages: LanguagePreference[];
}

export interface LanguagePreference {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'conversational';
  isPreferred: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  timezone?: string;
}
