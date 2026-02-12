export const SESSION_TYPE_CONFIG = {
  FOCUS: {
    label: 'Focus',
    description: 'Stay focused on a specific task with accountability and presence.',
    defaultDuration: 30,
    minDuration: 15,
    maxDuration: 120,
    icon: 'target',
  },
  DECISION: {
    label: 'Decision',
    description: 'Work through a decision with structured support and clear options.',
    defaultDuration: 45,
    minDuration: 15,
    maxDuration: 90,
    icon: 'scale',
  },
  EMOTIONAL_UNLOAD: {
    label: 'Emotional Unload',
    description: 'Express and process emotions in a safe, structured, non-therapeutic setting.',
    defaultDuration: 30,
    minDuration: 15,
    maxDuration: 60,
    icon: 'heart',
  },
  PLANNING: {
    label: 'Planning',
    description: 'Plan and organize with structured accountability and actionable outcomes.',
    defaultDuration: 60,
    minDuration: 30,
    maxDuration: 120,
    icon: 'map',
  },
} as const;
