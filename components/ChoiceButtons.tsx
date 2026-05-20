'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { GuessAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChoiceButtonsProps {
  onGuess: (answer: GuessAnswer) => void;
  disabled: boolean;
  guess: GuessAnswer | null;
}

export function ChoiceButtons({ onGuess, disabled, guess }: ChoiceButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <ChoiceButton
        answer="ai"
        label="AI"
        icon={<Bot size={22} />}
        selected={guess === 'ai'}
        disabled={disabled}
        onGuess={onGuess}
        colorClass="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 dark:bg-violet-700 dark:hover:bg-violet-600"
        selectedClass="ring-4 ring-violet-300 dark:ring-violet-500"
      />
      <ChoiceButton
        answer="human"
        label="HUMAN"
        icon={<User size={22} />}
        selected={guess === 'human'}
        disabled={disabled}
        onGuess={onGuess}
        colorClass="bg-green-600 hover:bg-green-700 active:bg-green-800 dark:bg-green-700 dark:hover:bg-green-600"
        selectedClass="ring-4 ring-green-300 dark:ring-green-500"
      />
    </div>
  );
}

interface ChoiceButtonProps {
  answer: GuessAnswer;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  disabled: boolean;
  onGuess: (answer: GuessAnswer) => void;
  colorClass: string;
  selectedClass: string;
}

function ChoiceButton({
  answer,
  label,
  icon,
  selected,
  disabled,
  onGuess,
  colorClass,
  selectedClass,
}: ChoiceButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={() => !disabled && onGuess(answer)}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        'h-24 rounded-2xl text-white font-bold text-lg',
        'transition-all duration-150 btn-shadow select-none',
        colorClass,
        selected && selectedClass,
        disabled && 'opacity-70 cursor-not-allowed'
      )}
      aria-label={`Guess ${label}`}
    >
      {icon}
      <span className="tracking-widest text-sm">{label}</span>
    </motion.button>
  );
}
