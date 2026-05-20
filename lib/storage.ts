import type { UserStats, GameResult, GuessAnswer } from './types';

const STATS_KEY = 'aivshuman_stats';
const TODAY_KEY = 'aivshuman_today';

export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDefaultStats(): UserStats {
  return {
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    results: [],
    lastPlayedDate: null,
  };
}

export function loadStats(): UserStats {
  if (typeof window === 'undefined') return getDefaultStats();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return getDefaultStats();
    return JSON.parse(raw) as UserStats;
  } catch {
    return getDefaultStats();
  }
}

export function saveStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getTodayResult(): GameResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return null;
    const result = JSON.parse(raw) as GameResult;
    if (result.date !== getTodayUTC()) return null;
    return result;
  } catch {
    return null;
  }
}

export function saveGameResult(
  result: GameResult,
  stats: UserStats
): UserStats {
  if (typeof window === 'undefined') return stats;

  localStorage.setItem(TODAY_KEY, JSON.stringify(result));

  const today = getTodayUTC();
  const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];

  const currentStreak =
    stats.lastPlayedDate === yesterday ? stats.currentStreak + 1 : 1;
  const bestStreak = Math.max(stats.bestStreak, currentStreak);

  const newStats: UserStats = {
    currentStreak,
    bestStreak,
    totalGames: stats.totalGames + 1,
    results: [result, ...stats.results].slice(0, 90),
    lastPlayedDate: today,
  };

  saveStats(newStats);
  return newStats;
}

export function getWinRate(stats: UserStats): number {
  if (stats.totalGames === 0) return 0;
  const wins = stats.results.filter((r) => r.score === r.correctAnswers.length);
  return Math.round((wins.length / stats.totalGames) * 100);
}

export function getShareText(result: GameResult, url: string): string {
  const grid = result.guesses
    .map((g, i) => (g === result.correctAnswers[i] ? '🟢' : '🔴'))
    .join('');
  return `AI vs Human #${String(result.puzzleNumber).padStart(3, '0')} — ${result.score}/${result.correctAnswers.length} ${grid}\n${url}`;
}

export function getMsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}
