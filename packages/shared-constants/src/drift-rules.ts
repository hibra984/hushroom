export const DRIFT_CONFIG = {
  escalation: {
    lowThreshold: 1,
    mediumThreshold: 2,
    highThreshold: 4,
  },
  timerWarnings: {
    warningPercent: 80,
    overPercent: 100,
    criticalPercent: 120,
  },
  sessionPhases: {
    openingPercent: 10,
    corePercent: 80,
    closingPercent: 10,
  },
} as const;
