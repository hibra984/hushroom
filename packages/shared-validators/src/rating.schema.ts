import { z } from 'zod';

const scoreField = z.number().int().min(1).max(5);

export const createRatingSchema = z.object({
  sessionId: z.string().uuid(),
  overallScore: scoreField,
  goalAchievement: scoreField.optional(),
  presenceQuality: scoreField.optional(),
  contractAdherence: scoreField.optional(),
  communication: scoreField.optional(),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().default(false),
});
