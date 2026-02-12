export interface Goal {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  successCriteria: string[];
  keywords: string[];
  isAchieved: boolean | null;
  achievementNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  sessionId: string;
  title: string;
  description: string;
  successCriteria: string[];
  keywords?: string[];
}
