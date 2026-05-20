'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { PuzzleItem, GuessAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: PuzzleItem;
  itemIndex: number;
  guess: GuessAnswer | null;
  correctAnswer: GuessAnswer | null;
  revealed: boolean;
}

export function ItemCard({ item, itemIndex, guess, correctAnswer, revealed }: ItemCardProps) {
  const isCorrect = guess === correctAnswer;
  const flashClass = revealed && guess !== null
    ? isCorrect
      ? 'animate-flash-green'
      : 'animate-shake animate-flash-red'
    : '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={itemIndex}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className={cn(
          'w-full rounded-2xl overflow-hidden card-shadow border border-slate-200/80 dark:border-slate-700/60',
          'bg-white dark:bg-slate-800',
          flashClass
        )}
      >
        {item.type === 'image' ? (
          <ImageContent item={item} revealed={revealed} guess={guess} isCorrect={isCorrect} />
        ) : (
          <TextContent item={item} revealed={revealed} guess={guess} isCorrect={isCorrect} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function ImageContent({
  item,
  revealed,
  guess,
  isCorrect,
}: {
  item: PuzzleItem;
  revealed: boolean;
  guess: GuessAnswer | null;
  isCorrect: boolean;
}) {
  return (
    <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900">
      <Image
        src={item.content}
        alt="Puzzle image — is this AI or human?"
        fill
        className="object-cover"
        sizes="(max-width: 500px) 100vw, 500px"
        priority
      />
      {revealed && guess !== null && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-gradient-to-t from-black/60 via-black/10 to-transparent'
          )}
        >
          <RevealBadge guess={guess} isCorrect={isCorrect} />
        </div>
      )}
    </div>
  );
}

function TextContent({
  item,
  revealed,
  guess,
  isCorrect,
}: {
  item: PuzzleItem;
  revealed: boolean;
  guess: GuessAnswer | null;
  isCorrect: boolean;
}) {
  return (
    <div className="relative p-6 min-h-[200px] flex flex-col justify-between">
      <div className="flex-1">
        <p className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-100">
          &ldquo;{item.content}&rdquo;
        </p>
        {/* Source only shown after reveal — seeing the author is a dead giveaway */}
        {revealed && item.source && (
          <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {item.source}
          </p>
        )}
      </div>
      {revealed && guess !== null && (
        <div className="mt-4 flex justify-center">
          <RevealBadge guess={guess} isCorrect={isCorrect} />
        </div>
      )}
    </div>
  );
}

function RevealBadge({ guess, isCorrect }: { guess: GuessAnswer; isCorrect: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        'px-4 py-2 rounded-full text-white font-bold text-sm flex items-center gap-2',
        isCorrect ? 'bg-green-500' : 'bg-red-500'
      )}
    >
      <span>{isCorrect ? '✓' : '✗'}</span>
      <span>{guess === 'ai' ? 'AI' : 'HUMAN'}</span>
    </motion.div>
  );
}
