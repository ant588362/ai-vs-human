'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Trophy, BarChart3, Percent } from 'lucide-react';
import type { UserStats } from '@/lib/types';
import { getWinRate } from '@/lib/storage';

interface StatsModalProps {
  stats: UserStats;
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ stats, isOpen, onClose }: StatsModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const winRate = getWinRate(stats);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-[440px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Stats</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats grid */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <StatCard
                  icon={<Flame size={20} className="text-orange-500" />}
                  value={stats.currentStreak}
                  label="Current Streak"
                />
                <StatCard
                  icon={<Trophy size={20} className="text-yellow-500" />}
                  value={stats.bestStreak}
                  label="Best Streak"
                />
                <StatCard
                  icon={<BarChart3 size={20} className="text-blue-500" />}
                  value={stats.totalGames}
                  label="Played"
                />
                <StatCard
                  icon={<Percent size={20} className="text-violet-500" />}
                  value={`${winRate}%`}
                  label="Win Rate"
                />
              </div>

              {/* Recent results */}
              {stats.results.length > 0 && (
                <div className="px-6 pb-6">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Recent Games
                  </p>
                  <div className="space-y-2">
                    {stats.results.slice(0, 7).map((r) => {
                      const grid = r.guesses
                        .map((g, i) => (g === r.correctAnswers[i] ? '🟢' : '🔴'))
                        .join('');
                      return (
                        <div key={r.date} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 dark:text-slate-500 tabular-nums text-xs font-medium">
                            {r.date}
                          </span>
                          <span className="tracking-widest">{grid}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums text-xs">
                            {r.score}/{r.correctAnswers.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stats.results.length === 0 && (
                <div className="px-6 pb-8 text-center">
                  <p className="text-slate-400 dark:text-slate-500 text-sm">
                    Play your first puzzle to start tracking stats!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 flex flex-col items-center gap-1.5">
      {icon}
      <span className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
        {value}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
