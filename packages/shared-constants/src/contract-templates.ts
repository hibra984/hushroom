export interface ContractTemplateDefinition {
  name: string;
  description: string;
  sessionType: string;
  mode: string;
  rules: { type: string; description?: string; maxMinutes?: number; topics?: string[] }[];
}

export const CONTRACT_TEMPLATES: ContractTemplateDefinition[] = [
  {
    name: 'Focus Standard',
    description: 'Moderate focus enforcement with gentle reminders.',
    sessionType: 'FOCUS',
    mode: 'MODERATE',
    rules: [
      { type: 'no_advice', description: 'Companion will not give advice' },
      { type: 'time_bound', maxMinutes: 30 },
      { type: 'topic_focus', description: 'Stay on the declared goal topic' },
    ],
  },
  {
    name: 'Focus Strict',
    description: 'Strict focus enforcement with immediate drift alerts.',
    sessionType: 'FOCUS',
    mode: 'STRICT',
    rules: [
      { type: 'no_advice', description: 'Companion will not give advice' },
      { type: 'time_bound', maxMinutes: 30 },
      { type: 'topic_focus', description: 'Stay on the declared goal topic' },
      { type: 'no_interruption', description: 'Minimal off-topic conversation allowed' },
    ],
  },
  {
    name: 'Focus Open',
    description: 'Open presence with minimal intervention.',
    sessionType: 'FOCUS',
    mode: 'FLEXIBLE',
    rules: [
      { type: 'open_presence', description: 'Companion provides silent presence' },
      { type: 'time_bound', maxMinutes: 30 },
    ],
  },
  {
    name: 'Decision Standard',
    description: 'Structured decision support with balanced enforcement.',
    sessionType: 'DECISION',
    mode: 'MODERATE',
    rules: [
      { type: 'structured_options', description: 'Explore options systematically' },
      { type: 'time_bound', maxMinutes: 45 },
      { type: 'no_persuasion', description: 'Companion will not push toward a decision' },
    ],
  },
  {
    name: 'Decision Strict',
    description: 'Highly structured decision framework with strict time limits.',
    sessionType: 'DECISION',
    mode: 'STRICT',
    rules: [
      { type: 'structured_options', description: 'Follow structured decision framework' },
      { type: 'time_bound', maxMinutes: 45 },
      { type: 'no_persuasion', description: 'Companion will not push toward a decision' },
      { type: 'actionable_outcomes', description: 'Must end with clear decision or next steps' },
    ],
  },
  {
    name: 'Decision Open',
    description: 'Flexible decision exploration.',
    sessionType: 'DECISION',
    mode: 'FLEXIBLE',
    rules: [
      { type: 'open_presence', description: 'Free-form decision discussion' },
      { type: 'time_bound', maxMinutes: 45 },
    ],
  },
  {
    name: 'Emotional Unload Standard',
    description: 'Active listening with gentle boundaries.',
    sessionType: 'EMOTIONAL_UNLOAD',
    mode: 'MODERATE',
    rules: [
      { type: 'active_listening', description: 'Companion listens actively' },
      { type: 'no_advice', description: 'No advice or solutions offered' },
      { type: 'time_bound', maxMinutes: 30 },
    ],
  },
  {
    name: 'Emotional Unload Open',
    description: 'Open emotional expression with minimal structure.',
    sessionType: 'EMOTIONAL_UNLOAD',
    mode: 'FLEXIBLE',
    rules: [
      { type: 'active_listening', description: 'Companion listens actively' },
      { type: 'no_advice', description: 'No advice or solutions offered' },
      { type: 'time_bound', maxMinutes: 30 },
      { type: 'open_presence', description: 'Minimal structure, maximum expression space' },
    ],
  },
  {
    name: 'Emotional Unload Guided',
    description: 'Structured emotional processing with check-ins.',
    sessionType: 'EMOTIONAL_UNLOAD',
    mode: 'STRICT',
    rules: [
      { type: 'active_listening', description: 'Companion listens actively' },
      { type: 'no_advice', description: 'No advice or solutions offered' },
      { type: 'time_bound', maxMinutes: 30 },
      { type: 'structured_checkins', description: 'Periodic check-ins on emotional state' },
    ],
  },
  {
    name: 'Planning Standard',
    description: 'Structured planning with accountability.',
    sessionType: 'PLANNING',
    mode: 'MODERATE',
    rules: [
      { type: 'structured_steps', description: 'Follow structured planning steps' },
      { type: 'time_bound', maxMinutes: 60 },
      { type: 'actionable_outcomes', description: 'Must produce actionable plan items' },
    ],
  },
  {
    name: 'Planning Strict',
    description: 'Rigorous planning framework with milestones.',
    sessionType: 'PLANNING',
    mode: 'STRICT',
    rules: [
      { type: 'structured_steps', description: 'Follow rigorous planning framework' },
      { type: 'time_bound', maxMinutes: 60 },
      { type: 'actionable_outcomes', description: 'Must produce actionable plan items' },
      { type: 'milestone_tracking', description: 'Define milestones and deadlines' },
    ],
  },
  {
    name: 'Planning Open',
    description: 'Free-form planning with gentle structure.',
    sessionType: 'PLANNING',
    mode: 'FLEXIBLE',
    rules: [
      { type: 'open_presence', description: 'Free-form planning discussion' },
      { type: 'time_bound', maxMinutes: 60 },
    ],
  },
];
