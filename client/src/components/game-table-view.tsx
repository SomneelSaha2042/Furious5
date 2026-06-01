import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';
import { Card } from './card';
import { PlayerHand } from './player-hand';
import { TurnTimer } from './turn-timer';
import { RoundCounter } from './round-counter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameState, Player, Card as CardType } from '@shared/game-types';
import { canDrawFromTable, sumPoints, sortCardsForDisplay } from '@shared/game-engine';
import {
  DeckIcon,
  DrawCardIcon,
  DropCardIcon,
  TimerIcon,
} from '@/components/icons/Furious5Icons';

interface GameTableViewProps {
  gameState: GameState;
  playerId: string;
  onCall: () => void;
  onDropCards: (cards: CardType[], kind: string) => void;
  onDrawFromDeck: () => void;
  onDrawFromTable: (cardIndex: number) => void;
}

const TURN_STAGE_COPY: Record<GameState['turnStage'], string> = {
  start: 'Drop a combination or single card',
  dropped: 'Draw from the deck or table to finish',
  end: 'Waiting for next player',
};

function formatCardLabel(card: CardType) {
  const rank = (() => {
    if (card.r === 1) return 'A';
    if (card.r === 11) return 'J';
    if (card.r === 12) return 'Q';
    if (card.r === 13) return 'K';
    return card.r.toString();
  })();

  const suit = {
    H: '\u2665',
    D: '\u2666',
    C: '\u2663',
    S: '\u2660',
  }[card.s];

  return `${rank}${suit}`;
}

export function GameTableView({
  gameState,
  playerId,
  onCall,
  onDropCards,
  onDrawFromDeck,
  onDrawFromTable,
}: GameTableViewProps) {
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.turnIdx]?.id === playerId;
  const currentTurnPlayer = gameState.players[gameState.turnIdx];
  const canDrawFromTableNow = Boolean(
    isMyTurn && gameState.turnStage === 'dropped' && gameState.tableDrop
  );

  const opponents = useMemo(() => {
    const myIndex = gameState.players.findIndex(player => player.id === playerId);
    if (myIndex === -1) return gameState.players;

    const rotated = [
      ...gameState.players.slice(myIndex + 1),
      ...gameState.players.slice(0, myIndex),
    ];

    return rotated.filter(player => player.id !== playerId);
  }, [gameState.players, playerId]);

  const leftOpponents = opponents.filter((_, index) => index % 2 === 0);
  const rightOpponents = opponents.filter((_, index) => index % 2 === 1);

  const dropKindLabel = (kind: string) => {
    switch (kind) {
      case 'single':
        return 'Single';
      case 'pair':
        return 'Pair';
      case 'trips':
        return 'Triple';
      case 'quads':
        return 'Quad';
      case 'straight':
        return 'Straight';
      default:
        return 'Set';
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,.8fr)] items-stretch">
        <motion.div
          className="table-panel flex flex-col gap-3 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Active Turn</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TimerIcon className="h-4 w-4" />
              <span>{gameState.turnStage === 'dropped' ? 'Draw phase' : 'Drop phase'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current Player</p>
              <p className="text-lg font-semibold" data-testid="current-turn-player">
                {currentTurnPlayer?.name ?? 'Waiting for players'}
              </p>
            </div>
            <div className={cn('chip-stack px-3 py-1 text-xs text-mono', !currentTurnPlayer && 'opacity-0')}>
              <span>{currentTurnPlayer ? sumPoints(currentTurnPlayer.hand) : '--'} pts</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-5">
            {TURN_STAGE_COPY[gameState.turnStage]}
          </p>
        </motion.div>

        <motion.div
          className="table-panel flex items-center justify-center p-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <RoundCounter
            roundNumber={gameState.roundNumber}
            gameStartTime={gameState.gameStartTime}
            currentPlayer={currentTurnPlayer?.name}
            totalPlayers={gameState.players.length}
          />
        </motion.div>

        <motion.div
          className="table-panel flex flex-col justify-between gap-2 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DeckIcon className="h-4 w-4" />
            <span>Deck remaining</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold" data-testid="deck-count">
              {gameState.deck.length}
            </span>
            <div className="text-right text-xs text-muted-foreground">
              <p>Table cards update live after each drop.</p>
            </div>
          </div>
        </motion.div>
      </header>

      <section className="felt-surface felt-readable felt-ring relative p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="lg:hidden flex flex-col gap-4">
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
              <AnimatePresence>
                {opponents.map((player, index) => {
                  const isCurrentTurn = currentTurnPlayer?.id === player.id;
                  return (
                    <motion.div
                      key={player.id}
                      className={cn(
                        'min-w-[220px] flex-shrink-0 rounded-lg border border-white/15 bg-black/25 p-3 shadow-lg',
                        isCurrentTurn && 'ring-2 ring-accent shadow-lg'
                      )}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <PlayerBadge player={player} isCurrentTurn={isCurrentTurn} index={index} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <TableDropPanel
              className="rounded-lg border border-white/10 p-4 sm:p-6"
              tableDrop={gameState.tableDrop}
              dropKindLabel={dropKindLabel}
              formatCardLabel={formatCardLabel}
              canDrawFromTableNow={canDrawFromTableNow}
              isMyTurn={isMyTurn}
              turnStage={gameState.turnStage}
              onDrawFromTable={onDrawFromTable}
            />
          </div>

          <div className="hidden lg:grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)] items-start gap-4">
            <div className="flex flex-col gap-4">
              {leftOpponents.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={cn(
                    'rounded-lg border border-white/15 bg-black/25 p-4 shadow-lg',
                    currentTurnPlayer?.id === player.id && 'ring-2 ring-accent shadow-lg'
                  )}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlayerBadge player={player} isCurrentTurn={currentTurnPlayer?.id === player.id} index={index} />
                </motion.div>
              ))}
            </div>

            <TableDropPanel
              className="rounded-lg border border-white/10 p-4 sm:p-6"
              tableDrop={gameState.tableDrop}
              dropKindLabel={dropKindLabel}
              formatCardLabel={formatCardLabel}
              canDrawFromTableNow={canDrawFromTableNow}
              isMyTurn={isMyTurn}
              turnStage={gameState.turnStage}
              onDrawFromTable={onDrawFromTable}
            />

            <div className="flex flex-col gap-4">
              {rightOpponents.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={cn(
                    'rounded-lg border border-white/15 bg-black/25 p-4 shadow-lg',
                    currentTurnPlayer?.id === player.id && 'ring-2 ring-accent shadow-lg'
                  )}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlayerBadge
                    player={player}
                    isCurrentTurn={currentTurnPlayer?.id === player.id}
                    index={index + leftOpponents.length}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Track card counts, chip movement, and the current draw phase without leaving the table.</span>
          </div>
        </div>
      </section>

      {currentPlayer && (
        <PlayerHand
          gameState={gameState}
          playerId={playerId}
          onCall={onCall}
          onDropCards={onDropCards}
          onDrawFromDeck={onDrawFromDeck}
        />
      )}

      <TurnTimer
        isActive={isMyTurn && gameState.turnStage === 'start'}
        duration={30}
        onTimeout={() => {
          if (currentPlayer && currentPlayer.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentPlayer.hand.length);
            const randomCard = currentPlayer.hand[randomIndex];
            onDropCards([randomCard], 'single');
          }
        }}
      />
    </div>
  );
}

interface TableDropPanelProps {
  tableDrop: GameState['tableDrop'];
  dropKindLabel: (kind: string) => string;
  formatCardLabel: (card: CardType) => string;
  canDrawFromTableNow: boolean;
  isMyTurn: boolean;
  turnStage: GameState['turnStage'];
  onDrawFromTable: (cardIndex: number) => void;
  className?: string;
}

function TableDropPanel({
  tableDrop,
  dropKindLabel,
  formatCardLabel,
  canDrawFromTableNow,
  isMyTurn,
  turnStage,
  onDrawFromTable,
  className,
}: TableDropPanelProps) {
  return (
    <motion.div
      className={cn('rounded-lg border border-white/20 bg-black/30 p-4 text-white shadow-2xl sm:p-6', className)}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.22 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-50/80">
          <DropCardIcon className="h-4 w-4" />
          <span className="heading-subtle text-xs">Table Drop</span>
        </div>
        {tableDrop && (
          <span className="text-xs text-emerald-50/70">
            {dropKindLabel(tableDrop.kind)} - {tableDrop.cards.length} card(s)
          </span>
        )}
      </div>

      <div className="flex min-h-[120px] flex-col items-center justify-center gap-4">
        <AnimatePresence initial={false}>
          {tableDrop ? (
            <motion.div
              key={tableDrop.cards.map(card => `${card.r}-${card.s}`).join('-')}
              className="flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {sortCardsForDisplay(tableDrop.cards, tableDrop.kind).map((card, index) => (
                <Card key={`${card.r}-${card.s}-${index}`} card={card} size="md" />
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty-table"
              className="max-w-xs text-center text-sm text-emerald-50/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
            >
              Drops land here each turn. Once a set is available, draw from the table during the draw phase to strategize.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {tableDrop && (
        <div className="mt-4 space-y-3">
          {canDrawFromTableNow ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {tableDrop.cards.map((card, originalIndex) => {
                if (!canDrawFromTable(tableDrop, originalIndex)) return null;

                return (
                  <Button
                    key={`${card.r}-${card.s}-${originalIndex}`}
                    variant="secondary"
                    size="sm"
                    onClick={() => onDrawFromTable(originalIndex)}
                    data-testid={`button-draw-table-${originalIndex}`}
                    className="justify-start gap-2"
                  >
                    <DrawCardIcon className="h-4 w-4" />
                    Take {formatCardLabel(card)}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-emerald-50/75" data-testid="take-cards-hint">
              {!isMyTurn
                ? 'Wait for your turn to take cards.'
                : turnStage === 'start'
                ? 'Drop a set before drawing from the table.'
                : 'No available cards to take right now.'}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface PlayerBadgeProps {
  player: Player;
  isCurrentTurn: boolean;
  index: number;
}

function PlayerBadge({ player, isCurrentTurn, index }: PlayerBadgeProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
              {player.name[0]?.toUpperCase()}
            </div>
            {isCurrentTurn && (
              <motion.span
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent shadow-md"
                layoutId="turn-indicator"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </div>
          <div>
            <p className="font-semibold" data-testid={`player-name-${index}`}>
              {player.name}
            </p>
            <p className="text-xs text-emerald-50/70">{player.hand.length} card{player.hand.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="chip-stack px-3 py-1 text-xs font-semibold">
          {player.chipDelta >= 0 ? '+' : ''}
          {player.chipDelta}
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(player.hand.length, 8) }).map((_, cardIndex) => (
          <div
            key={`${player.id}-card-${cardIndex}`}
            className="h-12 w-8 rounded-md border border-white/20 bg-white/8"
          />
        ))}
        {player.hand.length > 8 && (
          <span className="ml-2 text-xs text-emerald-50/70">+{player.hand.length - 8}</span>
        )}
      </div>
    </div>
  );
}
