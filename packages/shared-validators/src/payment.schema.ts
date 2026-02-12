import { z } from 'zod';

export const authorizePaymentSchema = z.object({
  sessionId: z.string().uuid(),
});

export const refundPaymentSchema = z.object({
  reason: z.enum(['TECHNICAL_FAILURE', 'COMPANION_NO_SHOW', 'ADMIN_OVERRIDE']),
});
