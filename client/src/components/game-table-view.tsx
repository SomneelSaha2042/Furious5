import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './card';
import { PlayerHand } from './player-hand';
import { TurnTimer } from './turn-timer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameState, Player, Card as CardType } from '@shared/game-types';
import { canDrawFromTable, sumPoints, sortCardsForDisplay } from '@shared/game-engine';
import {
  Users,
  Clock,
  LayoutGrid,
  Timer,
  Layers,
  Copy,
  ArrowDown,
  Info,
} from 'lucide-react';

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
    H: '♥',
    D: '♦',
    C: '♣',
    S: '♠',
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

  const dropKindLabel = (kind: string) => {
    switch (kind) {
      case 'single': return 'Single';
      case 'pair': return 'Pair';
      case 'trips': return 'Triple';
      case 'quads': return 'Quad';
      case 'straight': return 'Straight';
      default: return 'Set';
    }
  };

  const opponentPositions = [
    "absolute top-6 left-6 sm:top-10 sm:left-10",
    "absolute top-6 right-6 sm:top-10 sm:right-10",
    "absolute top-6 left-1/2 -translate-x-1/2",
    "absolute bottom-6 left-6 sm:bottom-10 sm:left-10",
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Stats Row */}
      <header className="grid gap-6 md:grid-cols-3 items-stretch">
        {/* Active Turn */}
        <motion.div
          className="bg-card rounded-2xl p-6 card-shadow border border-border relative overflow-hidden text-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">Active Turn</span>
            </div>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs">
              <Clock className="h-4 w-4 text-secondary" />
              <span>{gameState.turnStage === 'dropped' ? 'Draw phase' : 'Drop phase'}</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Current Player</p>
              <h2 className="font-display text-2xl font-bold text-primary" data-testid="current-turn-player">
                {currentTurnPlayer?.name ?? 'Waiting'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{TURN_STAGE_COPY[gameState.turnStage]}</p>
            </div>
            {currentTurnPlayer && (
              <div className="bg-victory-gold/10 text-victory-gold font-bold px-4 py-2 rounded-xl border border-victory-gold/20 font-mono">
                {sumPoints(currentTurnPlayer.hand)} pts
              </div>
            )}
          </div>
        </motion.div>

        {/* Round & Timer */}
        <motion.div
          className="bg-card rounded-2xl p-6 card-shadow border border-border flex flex-col justify-center text-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <div className="flex items-center justify-around bg-muted rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-primary">Round {gameState.roundNumber}</span>
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="font-mono font-bold text-primary">Active</span>
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-victory-gold rounded-full animate-pulse" />
              <span className="font-display text-xs text-primary font-semibold">{currentTurnPlayer?.name || 'Player'}</span>
            </div>
          </div>
        </motion.div>

        {/* Deck Remaining */}
        <motion.div
          className="bg-card rounded-2xl p-6 card-shadow border border-border text-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Deck remaining</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-primary" data-testid="deck-count">
              {gameState.deck.length}
            </span>
            <span className="text-xs text-muted-foreground max-w-[120px] leading-tight">Table cards update live after each drop.</span>
          </div>
        </motion.div>
      </header>

      {/* Main Game Table (Green Felt Area) */}
      <section className="bg-felt-green rounded-[32px] p-6 sm:p-8 border-8 border-primary relative overflow-hidden min-h-[460px] flex items-center justify-center table-inner-glow felt-texture text-white shadow-2xl">
        
        {/* Opponents Mini-Cards */}
        <AnimatePresence>
          {opponents.map((player, index) => {
            const posClass = opponentPositions[index % opponentPositions.length];
            const isCurrentTurn = currentTurnPlayer?.id === player.id;
            return (
              <motion.div 
                key={player.id} 
                className={posClass}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className={cn(
                  "bg-primary/45 backdrop-blur-md rounded-2xl p-3 sm:p-4 border flex items-center gap-3 sm:gap-4 w-44 sm:w-48 transition-transform hover:scale-105 shadow-lg",
                  isCurrentTurn ? "border-victory-gold" : "border-white/10"
                )}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-action-emerald flex items-center justify-center text-white font-bold shadow-lg text-lg">
                    {player.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-white font-bold text-xs sm:text-sm truncate">{player.name}</h3>
                      {isCurrentTurn && <div className="w-2 h-2 bg-victory-gold rounded-full animate-pulse flex-shrink-0" />}
                    </div>
                    <p className="text-white/60 text-[10px] sm:text-xs">{player.hand.length} card{player.hand.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="ml-auto bg-victory-gold text-primary font-mono text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0">
                    {player.chipDelta >= 0 ? '+' : ''}{player.chipDelta}
                  </div>
                </div>
                {/* Mini card back indicators */}
                <div className="flex gap-1 mt-2 ml-1">
                  {Array.from({ length: Math.min(player.hand.length, 6) }).map((_, cardIdx) => (
                    <div key={cardIdx} className="w-5 h-7 sm:w-6 sm:h-8 border border-white/20 rounded-sm bg-white/10" />
                  ))}
                  {player.hand.length > 6 && (
                    <span className="text-[10px] text-white/50 ml-1 font-bold">+{player.hand.length - 6}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Central Table Drop Area */}
        <div className="bg-primary/20 backdrop-blur-sm rounded-[24px] border-2 border-dashed border-white/20 w-full max-w-xl min-h-[16rem] p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 left-6 flex items-center gap-2 text-white/60">
            <Copy className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Table Drop</span>
          </div>

          <div className="flex min-h-[120px] flex-col items-center justify-center gap-4 py-8">
            <AnimatePresence initial={false}>
              {gameState.tableDrop ? (
                <motion.div
                  key={gameState.tableDrop.cards.map(card => `${card.r}-${card.s}`).join('-')}
                  className="flex flex-wrap justify-center gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  {sortCardsForDisplay(gameState.tableDrop.cards, gameState.tableDrop.kind).map((card, index) => (
                    <Card key={`${card.r}-${card.s}-${index}`} card={card} size="md" />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-table"
                  className="text-center text-white/40 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                >
                  <Layers className="h-12 w-12 block mx-auto text-white/20" />
                  <p className="text-[10px] uppercase tracking-widest max-w-[200px] mx-auto">
                    Drop a set before drawing from the table.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table Cards Draw Buttons */}
          {gameState.tableDrop && canDrawFromTableNow && (
            <div className="absolute bottom-4 flex flex-wrap justify-center gap-2 w-full px-4">
              {gameState.tableDrop.cards.map((card, originalIndex) => {
                if (!canDrawFromTable(gameState.tableDrop!, originalIndex)) return null;

                return (
                  <Button
                    key={`${card.r}-${card.s}-${originalIndex}`}
                    variant="outline"
                    size="sm"
                    onClick={() => onDrawFromTable(originalIndex)}
                    data-testid={`button-draw-table-${originalIndex}`}
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold flex items-center gap-1.5 text-xs py-1 px-3 rounded-lg"
                  >
                    <ArrowDown className="h-3 w-3" />
                    Take {formatCardLabel(card)}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/40">
          <Info className="h-4 w-4" />
          <span className="text-[10px] tracking-wide">Track card counts, chip movement, and current draw phase.</span>
        </div>
      </section>

      {/* Player's Hand Panel */}
      {currentPlayer && (
        <PlayerHand
          gameState={gameState}
          playerId={playerId}
          onCall={onCall}
          onDropCards={onDropCards}
          onDrawFromDeck={onDrawFromDeck}
        />
      )}

      {/* Floating Timer */}
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
