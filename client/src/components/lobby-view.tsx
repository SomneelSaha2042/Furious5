import { useState } from 'react';
import type { GameState } from '@shared/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Hourglass,
  Users,
  CheckCircle2,
  XCircle,
  Check,
  UserPlus,
  Layers,
  Hash,
  Copy,
  PlayCircle,
  Star,
  Search,
} from 'lucide-react';

interface LobbyViewProps {
  gameState: GameState;
  playerId: string;
  onStartGame: () => void;
  onToggleReady: () => void;
}

export function LobbyView({ gameState, playerId, onStartGame, onToggleReady }: LobbyViewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const allReady = gameState.players.length >= 2 && gameState.players.every(p => p.ready);
  const readyCount = gameState.players.filter(p => p.ready).length;
  const canStart = gameState.players.length >= 2 && allReady;

  const readyDescriptor =
    readyCount < gameState.players.length
      ? `Waiting for players to ready up... (${readyCount}/${gameState.players.length})`
      : 'All players ready! Game can start.';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    toast({
      title: 'Room code copied!',
      description: 'Share this code with friends to join your room.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center pt-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      {/* Central Lobby Card */}
      <div className="glass-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/25 w-full text-foreground">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-primary mb-1">Game Lobby</h1>
            <p className="font-sans text-sm text-muted-foreground flex items-center gap-2">
              <Hourglass className="h-4 w-4 animate-pulse text-victory-gold" />
              {readyDescriptor}
            </p>
          </div>
          <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-2 border border-border">
            <Users className="h-4 w-4 text-secondary" />
            <span className="font-mono text-xs font-bold text-secondary uppercase">
              {gameState.players.length} PLAYER{gameState.players.length === 1 ? '' : 'S'} CONNECTED
            </span>
          </div>
        </div>

        {/* Current Table Section */}
        <div className="mb-10">
          <h2 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">CURRENT TABLE</h2>
          <div className="space-y-4">
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
                      'flex items-center justify-between p-4 rounded-2xl bg-white border border-border shadow-sm transition-all',
                      isSelf && 'border-2 border-primary ring-1 ring-primary/20 bg-surface-cream'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-display text-lg font-bold">
                        {player.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-foreground">{player.name}</span>
                          {isSelf && <span className="font-mono text-[10px] text-muted-foreground">— YOU</span>}
                        </div>
                        <div className={cn(
                          'flex items-center gap-1 text-xs font-semibold',
                          player.connected ? 'text-action-emerald' : 'text-loss-crimson'
                        )}>
                          {player.connected ? (
                            <CheckCircle2 className="h-4 w-4 text-action-emerald" />
                          ) : (
                            <XCircle className="h-4 w-4 text-loss-crimson" />
                          )}
                          <span>{player.connected ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      'px-4 py-1.5 rounded-full font-mono text-xs font-bold flex items-center gap-2 border',
                      isReady 
                        ? 'bg-action-emerald text-white border-action-emerald' 
                        : 'bg-muted text-muted-foreground border-border'
                    )}>
                      {isReady && <Check className="h-3 w-3" />}
                      {isReady ? 'Ready' : 'Not Ready'}
                    </div>
                  </motion.div>
                );
              })}

              {/* Waiting Spot Placeholder if less than 2 players */}
              {gameState.players.length < 2 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-dashed border-border">
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <span className="font-display text-sm font-semibold italic text-muted-foreground">Waiting for opponent...</span>
                  </div>
                  <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full font-mono text-xs font-bold border border-border">
                    Not Ready
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Room Code Section */}
        <div className="bg-surface-cream border border-primary/10 rounded-2xl p-6 text-center mb-10 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 text-primary">
            <Layers className="h-[120px] w-[120px]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-action-emerald mb-1">
              <Hash className="h-6 w-6 text-victory-gold" />
              <span className="font-display text-2xl font-bold tracking-widest text-primary">
                {gameState.roomCode}
              </span>
            </div>
            <p className="font-sans text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              Share this code with friends so they can join your room.
            </p>
            <button
              onClick={handleCopyCode}
              className={cn(
                "w-full md:w-auto px-10 py-3 rounded-xl font-display font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-sm hover:shadow-md border-2",
                copied 
                  ? "bg-action-emerald/10 border-action-emerald text-action-emerald"
                  : "bg-white border-border hover:border-victory-gold text-foreground"
              )}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              )}
              {copied ? 'Copied!' : 'Copy room code'}
            </button>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <button
            onClick={onToggleReady}
            className={cn(
              "chunky-button py-4 rounded-xl font-display font-bold flex items-center justify-center gap-3 transition-all",
              currentPlayer?.ready 
                ? "bg-loss-crimson hover:brightness-110 text-white shadow-[0_4px_0_0_rgba(190,18,60,0.4)]"
                : "bg-action-emerald hover:brightness-110 text-white shadow-[0_4px_0_0_rgba(16,185,129,0.4)]"
            )}
          >
            {currentPlayer?.ready ? (
              <XCircle className="h-5 w-5 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {currentPlayer?.ready ? 'Not ready' : 'Ready up'}
          </button>
          
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={cn(
              "py-4 rounded-xl font-display font-bold flex items-center justify-center gap-3 transition-all",
              canStart
                ? "chunky-button bg-primary hover:brightness-110 text-white shadow-[0_4px_0_0_rgba(0,53,39,0.4)]"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-80 border border-border"
            )}
          >
            {canStart ? (
              <PlayCircle className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5 animate-pulse" />
            )}
            {canStart
              ? 'Start game'
              : gameState.players.length < 2
              ? `Need 1 more player`
              : `Waiting for opponent`}
          </button>
        </div>

        {/* Rules Section */}
        <div className="bg-muted rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4 text-victory-gold">
            <Star className="h-5 w-5 fill-current" />
            <h3 className="font-display font-semibold text-primary">Quick rules</h3>
          </div>
          <ul className="space-y-3 font-sans text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-victory-gold font-bold">01</span>
              Start with five cards and aim to get below five points.
            </li>
            <li className="flex gap-3">
              <span className="text-victory-gold font-bold">02</span>
              Drop singles, pairs, trips, quads, or straights (3+).
            </li>
            <li className="flex gap-3">
              <span className="text-victory-gold font-bold">03</span>
              Call when your total is under five to end the round.
            </li>
            <li className="flex gap-3">
              <span className="text-victory-gold font-bold">04</span>
              A=1, 2-10 face value, J=11, Q=12, K=13.
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
