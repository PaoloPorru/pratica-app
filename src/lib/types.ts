// src/lib/types.ts

export type GoalType =
  | "consapevolezza"
  | "disciplina"
  | "focus"
  | "gestire_stress"
  | "energia"
  | "sonno_migliore";

export interface UserProfile {
  name: string;
  wakeTime: string;        // "06:30"
  sleepTime: string;       // "22:30"
  workHoursPerDay: number; // 6-10
  stressLevel: number;     // 1-5
  goals: GoalType[];
  onboardingComplete: boolean;
  createdAt: string;       // ISO date
}

export type RoutineType =
  | "centratura"
  | "gratitudine"
  | "reset"
  | "focus"
  | "scarico"
  | "mattino"
  | "respirazione"
  | "meditazione";

export interface Routine {
  id: string;
  type: RoutineType;
  name: string;
  description: string;
  duration: number;        // seconds
  steps: RoutineStep[];
  icon: string;
  color: string;
  intensity: "leggera" | "media" | "intensa";
  tags: string[];
}

export interface RoutineStep {
  id: string;
  name: string;
  duration: number;        // seconds
  instruction: string;
  breathPhase?: "inhale" | "hold" | "exhale" | "rest";
}

export type MoodType = 1 | 2 | 3 | 4 | 5;

export interface DiaryEntry {
  id: string;
  date: string;            // YYYY-MM-DD
  mood: MoodType;
  energy: number;          // 1-5
  note: string;
  practicesCompleted: string[];
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  date: string;            // YYYY-MM-DD
  routineId: string;
  routineType: RoutineType;
  duration: number;        // seconds actually completed
  targetDuration: number;  // seconds planned
  completed: boolean;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  lastPracticeDate: string | null;
  activeDays: string[];    // YYYY-MM-DD array
}

export interface CoachRecommendation {
  routineId: string;
  routineType: RoutineType;
  reason: string;
  adjustedDuration: number;
  priority: "alta" | "media" | "bassa";
  message: string;
}

export interface AppState {
  profile: UserProfile | null;
  diary: DiaryEntry[];
  sessions: PracticeSession[];
  streak: StreakData;
  lastUpdated: string;
}
