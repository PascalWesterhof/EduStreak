export interface Habit {
  id: string;
  name: string;
  description?: string; // Optional description
  frequency: {
    type: 'daily' | 'weekly';
    times?: number; // e.g., 3 times a week, or 2 times a day (Note: daily multiple completions part will be simplified in logic)
    days?: number[]; // For weekly: 0 for Sunday, 1 for Monday, etc.
  };
  streak: number;
  longestStreak: number;
  completionHistory: Array<{ date: string }>; // Simplified: entry presence means completion for that date
  createdAt: string; // ISO date string
  isDefault?: boolean; // To identify default habits
}

export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date string, format YYYY-MM-DD
  isCompleted: boolean;
  notes?: string; // Notes specific to this day's completion - THIS TYPE IS LIKELY OBSOLETE OR NEEDS REVIEW
} 