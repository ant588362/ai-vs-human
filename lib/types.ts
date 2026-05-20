export type ItemType = 'image' | 'text';
export type GuessAnswer = 'ai' | 'human';

export interface PuzzleItem {
  id: string;
  type: ItemType;
  content: string;
  answer: GuessAnswer;
  explanation: string;
  source?: string;
}

export interface DailyPuzzle {
  date: string;
  puzzleNumber: number;
  items: PuzzleItem[];
}

export interface GameResult {
  date: string;
  puzzleNumber: number;
  guesses: GuessAnswer[];
  correctAnswers: GuessAnswer[];
  score: number;
}

export interface UserStats {
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  results: GameResult[];
  lastPlayedDate: string | null;
}

export type GamePhase = 'loading' | 'playing' | 'revealing' | 'results';

export interface GuessState {
  index: number;
  guess: GuessAnswer;
  correct: boolean;
}
