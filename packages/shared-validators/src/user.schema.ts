import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  preferredLanguage: z.string().min(2).max(5).optional(),
  timezone: z.string().min(1).optional(),
});

export const languagePreferenceSchema = z.object({
  language: z.string().min(2).max(5),
  proficiency: z.enum(['native', 'fluent', 'conversational']),
  isPreferred: z.boolean().default(false),
});

export const updateLanguagesSchema = z.object({
  languages: z.array(languagePreferenceSchema).min(1).max(10),
});
