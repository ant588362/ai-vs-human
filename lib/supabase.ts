import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = url && key ? createClient(url, key) : null;

export type SupabaseUser = {
  id: string;
  email: string | undefined;
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUser(): Promise<SupabaseUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

// ── Stats sync ────────────────────────────────────────────────────────────────

export interface RemoteResult {
  date: string;
  puzzle_number: number;
  score: number;
  total: number;
  guesses: string;        // JSON string
  correct_answers: string; // JSON string
}

export async function pushResultToCloud(userId: string, result: {
  date: string;
  puzzleNumber: number;
  score: number;
  guesses: string[];
  correctAnswers: string[];
}) {
  if (!supabase) return;
  await supabase.from('game_results').upsert({
    user_id: userId,
    date: result.date,
    puzzle_number: result.puzzleNumber,
    score: result.score,
    total: result.correctAnswers.length,
    guesses: JSON.stringify(result.guesses),
    correct_answers: JSON.stringify(result.correctAnswers),
  }, { onConflict: 'user_id,date' });
}

export async function fetchCloudResults(userId: string): Promise<RemoteResult[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(90);
  return (data ?? []) as RemoteResult[];
}
