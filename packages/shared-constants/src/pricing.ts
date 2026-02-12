export const PRICING = {
  defaultCurrency: 'EUR',
  minRate: 5,
  maxRate: 1000,
  commission: {
    STANDARD: 0.3,
    VERIFIED: 0.25,
    EXPERT: 0.2,
  },
  expertPremiumMultiplier: 1.5,
} as const;
