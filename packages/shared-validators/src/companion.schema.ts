import { z } from 'zod';

export const registerCompanionSchema = z.object({
  bio: z.string().max(2000).optional(),
  baseRate: z.number().positive().max(1000),
  expertiseTags: z.array(z.string().min(1).max(50)).max(10).optional(),
  driftEnforcement: z.enum(['STRICT', 'MODERATE', 'FLEXIBLE']).optional(),
  type: z.enum(['STANDARD', 'VERIFIED', 'EXPERT']).optional(),
});

export const updateCompanionSchema = z.object({
  bio: z.string().max(2000).optional(),
  baseRate: z.number().positive().max(1000).optional(),
  expertiseTags: z.array(z.string().min(1).max(50)).max(10).optional(),
  driftEnforcement: z.enum(['STRICT', 'MODERATE', 'FLEXIBLE']).optional(),
  maxConcurrent: z.number().int().min(1).max(5).optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  timezone: z.string().min(1).optional(),
  isRecurring: z.boolean().default(true),
  specificDate: z.string().datetime().optional(),
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema).min(1).max(42),
});
