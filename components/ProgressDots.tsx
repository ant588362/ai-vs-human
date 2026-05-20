'use client';

import { cn } from '@/lib/utils';
import type { GuessAnswer } from '@/lib/types';

interface ProgressDotsProps {
  total: number;
  current: number;
  guesses: (GuessAnswer | null)[];
  correctAnswers: (GuessAnswer | null)[];
}

export function ProgressDots({ total, current, guesses, correctAnswers }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: total }).map((_, i) => {
        const guessed = guesses[i] !== null;
        const correct = guessed && guesses[i] === correctAnswers[i];
        const isActive = i === current;

        return (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              guessed
                ? correct
                  ? 'w-3 h-3 bg-green-500'
                  : 'w-3 h-3 bg-red-500'
                : isActive
                ? 'w-3 h-3 bg-slate-900 dark:bg-white scale-110'
                : 'w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700'
            )}
          />
        );
      })}
    </div>
  );
}
