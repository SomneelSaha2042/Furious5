import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Card as CardType, GameState, Drop } from '@shared/game-types';
import { canCall, sumPoints, validateDrop } from '@shared/game-engine';
import {
  CallFiveIcon,
  DeckIcon,
  DropCardIcon,
  PlayerHandIcon,
} from '@/components/icons/Furious5Icons';

interface PlayerHandProps {
  gameState: GameState;
  playerId: string;
  onCall: () => void;
  onDropCards: (cards: CardType[], kind: string) => void;
  onDrawFromDeck: () => void;
}

export function PlayerHand({ gameState, playerId, onCall, onDropCards, onDrawFromDeck }: PlayerHandProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.turnIdx]?.id === playerId;
  const canCallNow = canCall(gameState, playerId);
  const handTotal = currentPlayer ? sumPoints(currentPlayer.hand) : 0;

  const cardKey = (card: CardType) => `${card.r}-${card.s}`;

  const selectedCardObjects = useMemo(() => {
    if (!currentPlayer) return [];
    return currentPlayer.hand.filter(card => selectedCards.has(cardKey(card)));
  }, [currentPlayer, selectedCards]);

  const validDrop = useMemo<Drop | null>(() => {
    if (!currentPlayer || selectedCardObjects.length === 0) return null;

    // Try different drop types
    const cards = selectedCardObjects;

    if (cards.length === 1) {
      return { kind: 'single', cards };
    }

    if (cards.length >= 2) {
      // Check for same rank
      const rank = cards[0].r;
      if (cards.every(card => card.r === rank)) {
        if (cards.length === 2) return { kind: 'pair', cards };
        if (cards.length === 3) return { kind: 'trips', cards };
        if (cards.length === 4) return { kind: 'quads', cards };
      }

      // Check for straight
      if (cards.length >= 3) {
        const sortedRanks = cards.map(c => c.r).sort((a, b) => a - b);
        let isStraight = true;
        for (let i = 1; i < sortedRanks.length; i++) {
          if (sortedRanks[i] !== sortedRanks[i-1] + 1) {
            isStraight = false;
            break;
          }
        }
        if (isStraight) {
          return { kind: 'straight', cards };
        }
      }
    }
    return null;
  }, [selectedCardObjects, currentPlayer]);

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn || gameState.turnStage !== 'start') return;

    const key = cardKey(card);
    const newSelected = new Set(selectedCards);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedCards(newSelected);
  };

  const handleDrop = () => {
    if (!validDrop || !currentPlayer) return;

    if (validateDrop(currentPlayer.hand, validDrop)) {
      onDropCards(validDrop.cards, validDrop.kind);
      setSelectedCards(new Set());
    }
  };

  const getDropButtonText = () => {
    if (!validDrop) return 'Select Cards';

    switch (validDrop.kind) {
      case 'single': return 'Drop Single';
      case 'pair': return 'Drop Pair';
      case 'trips': return 'Drop Triple';
      case 'quads': return 'Drop Quad';
      case 'straight': return `Drop Straight (${validDrop.cards.length})`;
      default: return 'Drop Cards';
    }
  };

  if (!currentPlayer) return null;

  const cardIsInteractive = isMyTurn && gameState.turnStage === 'start';

  return (
    <motion.section
      className="table-panel flex flex-col gap-6 p-4 sm:p-6"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
            {currentPlayer.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold" data-testid="player-name">
              <PlayerHandIcon className="mr-1.5 inline h-4 w-4 text-primary align-[-0.15em]" />
              {currentPlayer.name} (You)
            </p>
            <p className="text-sm text-muted-foreground">
              Hand total:
              {' '}
              <span className="font-semibold text-foreground" data-testid="hand-total">
                {handTotal}
              </span>
              {' '}points
            </p>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {cardIsInteractive
            ? 'Tap cards to build a drop. Scroll sideways to scan your hand.'
            : isMyTurn
            ? 'Complete your draw before taking more actions.'
            : 'Waiting for other players. Your hand is locked.'}
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-3 px-3 sm:px-4 snap-x snap-mandatory">
          {currentPlayer.hand.map((card, index) => {
            const key = cardKey(card);
            const isSelected = selectedCards.has(key);
            return (
              <motion.div
                key={`${key}-${index}`}
                whileHover={{ y: cardIsInteractive ? -6 : 0 }}
                whileTap={{ scale: cardIsInteractive ? 0.96 : 1 }}
                animate={{ y: isSelected ? -12 : 0, scale: isSelected ? 1.02 : 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="snap-start"
              >
                <Card
                  card={card}
                  size="lg"
                  selected={isSelected}
                  onClick={() => handleCardClick(card)}
                  className={cn(
                    cardIsInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-75',
                    'border-2 border-transparent hover:border-accent/70'
                  )}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          variant={canCallNow ? 'destructive' : 'secondary'}
          size="lg"
          disabled={!canCallNow || !isMyTurn}
          onClick={onCall}
          data-testid="button-call"
          className="flex items-center justify-center gap-2 py-3"
        >
          <CallFiveIcon className="h-5 w-5" />
          <span>{canCallNow ? `Call (${handTotal})` : `Call (${handTotal} >= 5)`}</span>
        </Button>

        <Button
          size="lg"
          disabled={!isMyTurn || gameState.turnStage !== 'start' || !validDrop}
          onClick={handleDrop}
          data-testid="button-drop"
          className="flex items-center justify-center gap-2 py-3"
        >
          <DropCardIcon className="h-5 w-5" />
          <span>
            {!isMyTurn
              ? 'Wait for turn'
              : gameState.turnStage !== 'start'
              ? 'Turn in progress'
              : getDropButtonText()}
          </span>
        </Button>

        <Button
          variant="secondary"
          size="lg"
          disabled={!isMyTurn || gameState.turnStage !== 'dropped'}
          onClick={onDrawFromDeck}
          data-testid="button-draw-deck"
          className="flex items-center justify-center gap-2 py-3"
        >
          <DeckIcon className="h-5 w-5" />
          <span>Draw from Deck</span>
        </Button>
      </div>
    </motion.section>
  );
}
