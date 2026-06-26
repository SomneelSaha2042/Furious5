import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './card';
import { cn } from '@/lib/utils';
import type { Card as CardType, GameState, Drop } from '@shared/game-types';
import { canCall, sumPoints, validateDrop } from '@shared/game-engine';
import {
  ShieldCheck,
  Hand,
  ArrowDown,
  Layers,
} from 'lucide-react';

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
      className="bg-card rounded-[24px] p-6 sm:p-8 card-shadow border border-border relative text-foreground"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xl shadow-md border-4 border-surface-cream">
            {currentPlayer.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-primary">{currentPlayer.name} (You)</h2>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              Hand total: <span className="font-bold text-primary" data-testid="hand-total">{handTotal} points</span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {cardIsInteractive
            ? 'Tap cards to build a drop. Scroll sideways to scan your hand.'
            : isMyTurn
            ? 'Complete your draw before taking more actions.'
            : 'Waiting for other players. Your hand is locked.'}
        </div>
      </div>

      {/* Cards list scrolling */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 snap-x snap-mandatory">
        {currentPlayer.hand.map((card, index) => {
          const key = cardKey(card);
          const isSelected = selectedCards.has(key);
          return (
            <div
              key={`${key}-${index}`}
              className="flex-shrink-0 snap-start"
            >
              <Card
                card={card}
                size="lg"
                selected={isSelected}
                onClick={() => handleCardClick(card)}
                className={cn(
                  cardIsInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-75',
                  !cardIsInteractive && 'hover:translate-y-0 hover:shadow-md hover:border-border'
                )}
              />
            </div>
          );
        })}
        {currentPlayer.hand.length === 0 && (
          <div className="flex-shrink-0 opacity-20">
            <div className="w-24 h-36 rounded-xl border-2 border-dashed border-border"></div>
          </div>
        )}
      </div>

      {/* Action buttons matching chunky designs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Call Button */}
        <button
          disabled={!canCallNow || !isMyTurn}
          onClick={onCall}
          className={cn(
            "h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
            canCallNow && isMyTurn
              ? "chunky-button bg-loss-crimson text-white shadow-[0_4px_0_0_#9f1239] hover:brightness-110"
              : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
          )}
        >
          <Hand className="h-5 w-5" />
          <span>Call ({handTotal})</span>
        </button>

        {/* Drop Button */}
        <button
          disabled={!isMyTurn || gameState.turnStage !== 'start' || !validDrop}
          onClick={handleDrop}
          className={cn(
            "h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
            isMyTurn && gameState.turnStage === 'start' && validDrop
              ? "chunky-button bg-action-emerald text-white shadow-[0_4px_0_0_#064e3b] hover:brightness-110"
              : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
          )}
        >
          <ArrowDown className="h-5 w-5" />
          <span>
            {!isMyTurn
              ? 'Wait for turn'
              : gameState.turnStage !== 'start'
              ? 'Turn in progress'
              : getDropButtonText()}
          </span>
        </button>

        {/* Draw Button */}
        <button
          disabled={!isMyTurn || gameState.turnStage !== 'dropped'}
          onClick={onDrawFromDeck}
          className={cn(
            "h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
            isMyTurn && gameState.turnStage === 'dropped'
              ? "chunky-button bg-primary text-white shadow-[0_4px_0_0_#002117] hover:brightness-110"
              : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
          )}
        >
          <Layers className="h-5 w-5" />
          <span>Draw from Deck</span>
        </button>
      </div>
    </motion.section>
  );
}
