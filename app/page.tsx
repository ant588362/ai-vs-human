import { Game } from '@/components/Game';

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center">
      <Game />
    </main>
  );
}
