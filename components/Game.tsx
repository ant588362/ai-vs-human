'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './Header';
import { ProgressDots } from './ProgressDots';
import { ItemCard } from './ItemCard';
import { ChoiceButtons } from './ChoiceButtons';
import { ResultsScreen } from './ResultsScreen';
import { StatsModal } from './StatsModal';
import { AuthModal } from './AuthModal';
import type { DailyPuzzle, GamePhase, GameResult, GuessAnswer, UserStats } from '@/lib/types';
import {
  getTodayUTC,
  getTodayResult,
  loadStats,
  saveGameResult,
} from '@/lib/storage';
import { haptic } from '@/lib/utils';
import { supabase, getUser, pushResultToCloud, type SupabaseUser } from '@/lib/supabase';

const REVEAL_DURATION_MS = 1100;

export function Game() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guesses, setGuesses] = useState<(GuessAnswer | null)[]>([null, null, null, null, null]);
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [stats, setStats] = useState<UserStats>(loadStats());
  const [statsOpen, setStatsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load auth state
  useEffect(() => {
    getUser().then(setUser);

    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser().then(setUser);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load today's puzzle
  useEffect(() => {
    const today = getTodayUTC();

    async function loadPuzzle() {
      try {
        const res = await fetch(`/daily/${today}.json`);
        if (!res.ok) throw new Error('No puzzle for today');
        const data: DailyPuzzle = await res.json();
        setPuzzle(data);

        const existing = getTodayResult();
        if (existing && existing.date === today) {
          setResult(existing);
          setGuesses(existing.guesses.map((g) => g));
          setPhase('results');
        } else {
          setPhase('playing');
        }
      } catch {
        setLoadError(true);
      }
    }

    loadPuzzle();
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const handleGuess = useCallback(
    (answer: GuessAnswer) => {
      if (!puzzle || phase !== 'playing') return;

      haptic(30);
      const newGuesses = [...guesses];
      newGuesses[currentIndex] = answer;
      setGuesses(newGuesses);
      setRevealedIndex(currentIndex);
      setPhase('revealing');

      const isCorrect = answer === puzzle.items[currentIndex].answer;
      haptic(isCorrect ? [30, 50, 30] : [80]);

      revealTimer.current = setTimeout(() => {
        setRevealedIndex(null);
        const isLast = currentIndex === puzzle.items.length - 1;

        if (isLast) {
          const correctAnswers = puzzle.items.map((item) => item.answer);
          const score = newGuesses.filter((g, i) => g === correctAnswers[i]).length;
          const gameResult: GameResult = {
            date: getTodayUTC(),
            puzzleNumber: puzzle.puzzleNumber,
            guesses: newGuesses as GuessAnswer[],
            correctAnswers,
            score,
          };
          setResult(gameResult);
          const newStats = saveGameResult(gameResult, stats);
          setStats(newStats);
          setPhase('results');

          // Push to Supabase if signed in
          if (user) {
            pushResultToCloud(user.id, {
              date: gameResult.date,
              puzzleNumber: gameResult.puzzleNumber,
              score: gameResult.score,
              guesses: gameResult.guesses,
              correctAnswers: gameResult.correctAnswers,
            });
          }
        } else {
          setCurrentIndex((i) => i + 1);
          setPhase('playing');
        }
      }, REVEAL_DURATION_MS);
    },
    [puzzle, phase, guesses, currentIndex, stats, user]
  );

  if (loadError) {
    return (
      <div className="w-full max-w-[500px] mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">🤖</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No puzzle today</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Run <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">npm run generate</code> to create today&apos;s content.
        </p>
      </div>
    );
  }

  if (phase === 'loading' || !puzzle) {
    return (
      <div className="w-full max-w-[500px] mx-auto px-4 py-16 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading puzzle…</p>
      </div>
    );
  }

  const item = puzzle.items[currentIndex];
  const isRevealing = revealedIndex === currentIndex;

  return (
    <>
      <div className="w-full max-w-[500px] mx-auto flex flex-col min-h-screen">
        <Header
          stats={stats}
          onStatsOpen={() => setStatsOpen(true)}
          onAuthOpen={() => setAuthOpen(true)}
          user={user}
        />

        <div className="flex-1 flex flex-col px-4 py-4 gap-4">
          {phase === 'results' && result ? (
            <ResultsScreen
              puzzle={puzzle}
              result={result}
              onStatsOpen={() => setStatsOpen(true)}
            />
          ) : (
            <>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Puzzle #{String(puzzle.puzzleNumber).padStart(3, '0')}
                </p>
                <ProgressDots
                  total={puzzle.items.length}
                  current={currentIndex}
                  guesses={guesses}
                  correctAnswers={puzzle.items.map((it) => it.answer)}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {currentIndex + 1} of {puzzle.items.length}
                </p>
              </div>

              <ItemCard
                item={item}
                itemIndex={currentIndex}
                guess={guesses[currentIndex]}
                correctAnswer={isRevealing ? item.answer : null}
                revealed={isRevealing}
              />

              <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                Is this{' '}
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {item.type === 'image' ? 'image' : 'passage'}
                </span>{' '}
                AI-generated or human-made?
              </p>

              <ChoiceButtons
                onGuess={handleGuess}
                disabled={phase === 'revealing'}
                guess={guesses[currentIndex]}
              />

              {isRevealing && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 animate-fade-in">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <StatsModal stats={stats} isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        onAuthChange={() => getUser().then(setUser)}
      />
    </>
  );
}
