import { z } from 'zod';

export const findMatchesSchema = z.object({
  sessionId: z.string().uuid(),
  language: z.string().min(2).max(5).optional(),
  preferredGender: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  requireExpert: z.boolean().optional(),
});

export const selectMatchSchema = z.object({
  sessionId: z.string().uuid(),
  companionId: z.string().uuid(),
});
