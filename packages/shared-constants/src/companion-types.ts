export const COMPANION_TYPE_CONFIG = {
  STANDARD: {
    label: 'Standard Companion',
    description: 'Anonymous presence-based sessions. Non-expert.',
    requiresVerification: false,
    commissionRate: 0.3,
  },
  VERIFIED: {
    label: 'Verified Companion',
    description: 'Real identity known to platform. Optional public display.',
    requiresVerification: true,
    commissionRate: 0.25,
  },
  EXPERT: {
    label: 'Expert Companion',
    description:
      'Expertise tags and documentation required. Higher pricing tier. Non-legal, non-medical advice unless explicitly certified.',
    requiresVerification: true,
    commissionRate: 0.2,
  },
} as const;

export const EXPERT_DISCLAIMER =
  'Non-legal, non-medical advice unless explicitly certified. This is not therapy, coaching, or professional consultation.';
