'use client';

import { Settings, Flame, Sun, Moon, UserCircle } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { UserStats } from '@/lib/types';
import type { SupabaseUser } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface HeaderProps {
  stats: UserStats;
  onStatsOpen: () => void;
  onAuthOpen: () => void;
  user: SupabaseUser | null;
}

export function Header({ stats, onStatsOpen, onAuthOpen, user }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="w-full max-w-[500px] mx-auto px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60">
      {/* Streak */}
      <button
        onClick={onStatsOpen}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="View stats"
      >
        <Flame
          size={16}
          className={cn(
            'transition-colors',
            stats.currentStreak > 0 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'
          )}
        />
        <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {stats.currentStreak}
        </span>
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center select-none">
        <span className="text-base font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
          AI <span className="text-slate-400 dark:text-slate-500 font-normal">vs</span> HUMAN
        </span>
        <span className="text-[10px] font-medium tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-0.5">
          Daily Puzzle
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={onAuthOpen}
          className={cn(
            'p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            user ? 'text-violet-500 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
          )}
          aria-label={user ? 'Account' : 'Sign in'}
          title={user ? user.email : 'Sign in to sync stats'}
        >
          <UserCircle size={16} />
        </button>
        <button
          onClick={onStatsOpen}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Open stats"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
