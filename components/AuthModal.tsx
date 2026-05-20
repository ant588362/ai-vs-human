'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, LogOut, CheckCircle, User } from 'lucide-react';
import { signInWithEmail, signOut, type SupabaseUser } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  onAuthChange: () => void;
}

type View = 'prompt' | 'sent' | 'loggedin';

export function AuthModal({ isOpen, onClose, user, onAuthChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>(user ? 'loggedin' : 'prompt');
  const [error, setError] = useState('');

  useEffect(() => {
    setView(user ? 'loggedin' : 'prompt');
  }, [user, isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error: err } = await signInWithEmail(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setView('sent');
    }
  }

  async function handleSignOut() {
    await signOut();
    onAuthChange();
    onClose();
  }

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
              className="w-full max-w-[400px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {view === 'loggedin' ? 'Account' : 'Save your streak'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {view === 'loggedin' && user && (
                  <div className="flex flex-col items-center gap-5 py-2">
                    <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <User size={26} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-white">{user.email}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Your stats sync across all devices
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors py-1"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}

                {view === 'sent' && (
                  <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={26} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Check your inbox</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        We sent a magic link to <strong>{email}</strong>.
                        Click it to sign in — no password needed.
                      </p>
                    </div>
                    <button
                      onClick={() => setView('prompt')}
                      className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Use a different email
                    </button>
                  </div>
                )}

                {view === 'prompt' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Enter your email to sync your streak and stats across devices. No password needed — we&apos;ll send a magic link.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        className={cn(
                          'w-full h-12 px-4 rounded-xl border text-sm',
                          'bg-slate-50 dark:bg-slate-700',
                          'border-slate-200 dark:border-slate-600',
                          'text-slate-900 dark:text-white placeholder:text-slate-400',
                          'focus:outline-none focus:ring-2 focus:ring-violet-500'
                        )}
                      />
                      {error && (
                        <p className="text-xs text-red-500">{error}</p>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className={cn(
                          'h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2',
                          'bg-violet-600 hover:bg-violet-700 transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <Mail size={16} />
                        {loading ? 'Sending…' : 'Send magic link'}
                      </button>
                    </form>
                    <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                      Stats are saved locally even without an account.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
