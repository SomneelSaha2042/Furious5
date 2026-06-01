import { cn } from '@/lib/utils';
import type { Card as CardType } from '@shared/game-types';

interface CardProps {
  card: CardType;
  selected?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function Card({ card, selected = false, faceDown = false, size = 'md', onClick, className }: CardProps) {
  const getSuitSymbol = (suit: CardType['s']) => {
    switch (suit) {
      case 'C': return '\u2663';
      case 'D': return '\u2666';
      case 'H': return '\u2665';
      case 'S': return '\u2660';
      default: return '?';
    }
  };

  const getRankString = (rank: CardType['r']) => {
    if (rank === 1) return 'A';
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    return rank.toString();
  };

  const isRed = card.s === 'D' || card.s === 'H';

  const sizeClasses = {
    sm: 'h-12 w-9',
    md: 'h-[4.75rem] w-14',
    lg: 'h-[6rem] w-[4.5rem]',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  if (faceDown) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-white/15 bg-secondary shadow-sm',
          sizeClasses[size],
          className,
        )}
        onClick={onClick}
      >
        <div className="absolute inset-1 rounded-[4px] border border-white/10" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgba(255,255,255,.08)_7px_8px)]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-sm transition duration-200',
        sizeClasses[size],
        selected && 'border-accent shadow-lg ring-2 ring-accent/45',
        !selected && 'hover:-translate-y-1 hover:shadow-md',
        className,
      )}
      onClick={onClick}
      data-testid={`card-${getRankString(card.r)}${card.s}`}
    >
      <div className="absolute inset-1 rounded-[4px] border border-zinc-100" />
      <div className={cn('relative font-bold leading-none', textSizeClasses[size], isRed ? 'text-red-600' : 'text-zinc-900')}>
        {getRankString(card.r)}
      </div>
      <div className={cn('relative mt-1 text-base leading-none', isRed ? 'text-red-600' : 'text-zinc-900')}>
        {getSuitSymbol(card.s)}
      </div>
    </div>
  );
}
