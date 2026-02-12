import { z } from 'zod';

const sessionTypeEnum = z.enum(['FOCUS', 'DECISION', 'EMOTIONAL_UNLOAD', 'PLANNING']);

export const createSessionSchema = z.object({
  type: sessionTypeEnum,
  plannedDuration: z.number().int().min(15).max(120),
  scheduledAt: z.string().datetime().optional(),
});

export const createGoalSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  successCriteria: z.array(z.string().min(1).max(500)).min(1).max(5),
  keywords: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export const createContractSchema = z.object({
  sessionId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  mode: z.enum(['STRICT', 'MODERATE', 'FLEXIBLE']),
  rules: z
    .array(
      z.object({
        type: z.string().min(1),
        description: z.string().optional(),
        maxMinutes: z.number().int().positive().optional(),
        topics: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});
