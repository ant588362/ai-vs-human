'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { DailyPuzzle, GameResult } from '@/lib/types';
import { getShareText, getMsUntilMidnightUTC } from '@/lib/storage';
import { formatCountdown } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ResultsScreenProps {
  puzzle: DailyPuzzle;
  result: GameResult;
  onStatsOpen: () => void;
}

export function ResultsScreen({ puzzle, result, onStatsOpen }: ResultsScreenProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function tick() {
      setCountdown(formatCountdown(getMsUntilMidnightUTC()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleShare() {
    const url = window.location.href;
    const text = getShareText(result, url);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }

  const emoji = result.guesses
    .map((g, i) => (g === result.correctAnswers[i] ? '🟢' : '🔴'))
    .join('');

  const perfect = result.score === result.correctAnswers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="w-full flex flex-col gap-5"
    >
      {/* Score header */}
      <div className="text-center space-y-1">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          {result.score}/{result.correctAnswers.length}
        </motion.div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          {perfect
            ? 'Perfect score! You\'re a human detector.'
            : result.score >= 3
            ? 'Good eye! Not easy to fool.'
            : 'Tricky, isn\'t it?'}
        </p>
        <div className="text-2xl tracking-widest mt-1">{emoji}</div>
      </div>

      {/* Item-by-item breakdown */}
      <div className="space-y-3">
        {puzzle.items.map((item, i) => {
          const correct = result.guesses[i] === result.correctAnswers[i];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className={cn(
                'rounded-xl p-4 border',
                correct
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/50'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {correct ? (
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle size={18} className="text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        result.correctAnswers[i] === 'ai'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      )}
                    >
                      {result.correctAnswers[i] === 'ai' ? 'AI' : 'HUMAN'}
                    </span>
                    {!correct && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        You guessed: {result.guesses[i]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                  {item.source && (
                    <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {item.source}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Share + next puzzle */}
      <div className="space-y-3 pt-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleShare}
          className={cn(
            'w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2',
            'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
            'transition-all btn-shadow hover:opacity-90'
          )}
        >
          <Share2 size={18} />
          {copied ? 'Copied!' : 'Share Result'}
        </motion.button>

        <button
          onClick={onStatsOpen}
          className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-2"
        >
          View stats
        </button>
      </div>

      {/* Come back tomorrow */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Next puzzle in
          </p>
          <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            <Clock size={18} className="text-slate-400" />
            {countdown}
          </p>
        </div>
        <div className="text-3xl">🤖</div>
      </div>
    </motion.div>
  );
}
