import { PaymentStatus, RefundReason } from './enums';

export interface Payment {
  id: string;
  sessionId: string;
  userId: string;
  stripePaymentIntentId: string | null;
  amount: number;
  companionPayout: number;
  platformFee: number;
  commissionRate: number;
  currency: string;
  status: PaymentStatus;
  authorizedAt: string | null;
  capturedAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundReason: RefundReason | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizePaymentDto {
  sessionId: string;
}

export interface RefundPaymentDto {
  reason: RefundReason;
}

export const COMMISSION_RATES = {
  STANDARD: 0.3,
  VERIFIED: 0.25,
  EXPERT: 0.2,
} as const;
