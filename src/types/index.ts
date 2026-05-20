export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  last_study_date: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  subject: 'Português' | 'Matemática';
  topic: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  incidence: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
  exam_board: string;
  exam_year?: number;
  tags: string[];
}

export interface AnswerResult {
  isCorrect: boolean;
  correctIndex: number;
  xpEarned: number;
  newXp: number;
  newLevel: number;
  newStreak: number;
  newBadges: string[];
}

export interface Progress {
  subject: string;
  topic: string;
  total_answered: number;
  total_correct: number;
}

export interface UserProgress {
  user: User;
  stats: {
    totalAnswered: number;
    totalCorrect: number;
    accuracy: number;
    bySubject: Record<string, { total: number; correct: number }>;
  };
  progress: Progress[];
  recentActivity: RecentActivity[];
  weeklyActivity: WeeklyActivity[];
}

export interface RecentActivity {
  subject: string;
  topic: string;
  is_correct: boolean;
  xp_earned: number;
  answered_at: string;
}

export interface WeeklyActivity {
  day: string;
  count: number;
  correct: number;
}

export interface Theory {
  id: string;
  subject: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  common_errors: string[];
  examples: string[];
  order_index: number;
  completed?: boolean;
}

export interface Video {
  id: string;
  subject: string;
  topic: string;
  title: string;
  youtube_id: string;
  duration: string;
  professor: string;
  thumbnail_url: string;
  order_index: number;
  userProgress?: {
    watched_seconds: number;
    completed: boolean;
    notes: string;
  } | null;
}

export interface RankingUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  total_answered: string;
  total_correct: string;
}
