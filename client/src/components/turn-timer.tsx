import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TimerIcon } from '@/components/icons/Furious5Icons';

interface TurnTimerProps {
  isActive: boolean;
  duration?: number; // in seconds
  onTimeout?: () => void;
}

export function TurnTimer({ isActive, duration = 30, onTimeout }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    setTimeLeft(duration);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onTimeout]);

  const urgency = timeLeft <= Math.max(5, duration * 0.25);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = useMemo(
    () => ((duration - timeLeft) / duration) * circumference,
    [circumference, duration, timeLeft]
  );

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="turn-timer"
          data-testid="turn-timer"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={cn(
            'fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg',
            urgency && 'border-destructive/60'
          )}
        >
          <motion.div
            className={cn(
              'grid place-items-center rounded-full border-2 p-2',
              urgency ? 'border-destructive/70 bg-destructive/10' : 'border-primary/60 bg-primary/10'
            )}
            animate={{ scale: urgency ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: urgency ? Infinity : 0, duration: 1.2 }}
          >
            <svg width="88" height="88" viewBox="0 0 88 88" className="text-muted-foreground">
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="var(--muted)"
                strokeWidth="6"
                fill="transparent"
              />
              <motion.circle
                cx="44"
                cy="44"
                r={radius}
                stroke={urgency ? 'var(--destructive)' : 'var(--primary)'}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-bold" data-testid="timer-seconds">
              {timeLeft}
            </span>
          </motion.div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TimerIcon className={cn('h-4 w-4', urgency ? 'text-destructive' : 'text-primary')} />
              <span className={urgency ? 'text-destructive' : 'text-foreground'}>Your turn</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {urgency ? 'Make a play before time runs out.' : 'Drop a combo or draw to continue.'}
            </p>
            <div
              data-testid="timer-progress"
              className="sr-only"
              style={{ width: `${(timeLeft / duration) * 100}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
