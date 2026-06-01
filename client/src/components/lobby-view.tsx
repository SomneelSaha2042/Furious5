import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { GameState } from '@shared/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LobbyIcon,
  RoomCodeIcon,
  SocketLiveIcon,
  StartGameIcon,
} from '@/components/icons/Furious5Icons';

interface LobbyViewProps {
  gameState: GameState;
  playerId: string;
  onStartGame: () => void;
  onToggleReady: () => void;
}

export function LobbyView({ gameState, playerId, onStartGame, onToggleReady }: LobbyViewProps) {
  const { toast } = useToast();
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const allReady = gameState.players.length >= 2 && gameState.players.every(p => p.ready);
  const readyCount = gameState.players.filter(p => p.ready).length;
  const canStart = gameState.players.length >= 2 && allReady;

  const readyDescriptor =
    readyCount < gameState.players.length
      ? `Waiting for players to ready up... (${readyCount}/${gameState.players.length})`
      : 'All players ready! Game can start.';

  return (
    <motion.div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <section className="table-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold" data-testid="lobby-title">
              Game Lobby
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <LobbyIcon className="h-4 w-4" />
              {readyDescriptor}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
            <Users className="h-4 w-4" />
            <span>
              {gameState.players.length}
              {' '}
              player{gameState.players.length === 1 ? '' : 's'} connected
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="heading-subtle text-muted-foreground text-xs">
            Current table
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {gameState.players.map((player, index) => {
                const isSelf = player.id === playerId;
                const isReady = player.ready;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3',
                      isSelf && 'ring-2 ring-primary/70 bg-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {player.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`player-name-${index}`}>
                          {player.name}
                          {isSelf && <span className="text-xs text-muted-foreground"> - you</span>}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <SocketLiveIcon className={cn('h-3 w-3', player.connected ? 'text-primary' : 'text-destructive')} />
                          <span>{player.connected ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                      isReady ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {isReady ? <Check className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                      <span>{isReady ? 'Ready' : 'Not Ready'}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-primary/25 bg-primary/10 p-6 text-center">
          <div className="text-2xl font-mono font-semibold text-primary mb-1" data-testid="room-code-display">
            <RoomCodeIcon className="mr-2 inline h-5 w-5 align-[-0.2em]" />
            {gameState.roomCode}
          </div>
          <p className="text-sm text-muted-foreground">
            Share this code with friends so they can join your room.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(gameState.roomCode);
              toast({
                title: 'Room code copied!',
                description: 'Send this to your friends to get the table started.',
              });
            }}
            data-testid="button-copy-code"
            className="mt-4 inline-flex w-full items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy room code
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            variant={currentPlayer?.ready ? 'secondary' : 'default'}
            onClick={onToggleReady}
            data-testid="button-toggle-ready"
            className="flex items-center justify-center gap-2 py-3"
          >
            {currentPlayer?.ready ? <Users className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {currentPlayer?.ready ? 'Mark as not ready' : 'Ready up'}
          </Button>

          <Button
            className="flex items-center justify-center gap-2 py-3"
            disabled={!canStart}
            onClick={onStartGame}
            data-testid="button-start-game"
            variant={canStart ? 'default' : 'secondary'}
          >
            <StartGameIcon className="h-4 w-4" />
            {canStart
              ? 'Start game'
              : gameState.players.length < 2
              ? `Need ${2 - gameState.players.length} more player${gameState.players.length === 1 ? '' : 's'}`
              : `Waiting for ${gameState.players.length - readyCount} player${gameState.players.length - readyCount === 1 ? '' : 's'} to ready up`}
          </Button>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-background/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            Quick rules
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Start with five cards and aim to get below five points.</li>
            <li>Drop singles, pairs, trips, quads, or straights (3+).</li>
            <li>Call when your total is under five to end the round.</li>
            <li>A=1, 2-10 face value, J=11, Q=12, K=13.</li>
          </ul>
        </div>
      </section>
    </motion.div>
  );
}
