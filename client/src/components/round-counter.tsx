import { formatDuration, intervalToDuration } from "date-fns";
import { useState, useEffect } from "react";
import { LobbyIcon, TimerIcon } from "@/components/icons/Furious5Icons";

interface RoundCounterProps {
  roundNumber: number;
  gameStartTime: number;
  currentPlayer?: string;
  totalPlayers: number;
}

export function RoundCounter({ 
  roundNumber, 
  gameStartTime, 
  currentPlayer, 
  totalPlayers 
}: RoundCounterProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second for live duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const duration = intervalToDuration({
    start: gameStartTime,
    end: currentTime
  });

  const formattedDuration = formatDuration(duration, {
    format: ['minutes', 'seconds'],
    zero: true,
    delimiter: ':'
  }).replace(/\D/g, ':').replace(/^:+|:+$/g, '') || '0:00';

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm" data-testid="round-counter">
      <div className="flex items-center gap-2">
        <LobbyIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid="text-round-number">
          Round {roundNumber}
        </span>
      </div>
      
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
      
      <div className="flex items-center gap-2">
        <TimerIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono" data-testid="text-game-duration">
          {formattedDuration || '0:00'}
        </span>
      </div>

      {currentPlayer && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-current-turn">
              {currentPlayer}'s turn
            </span>
          </div>
        </>
      )}
    </div>
  );
}
