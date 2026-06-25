import { useState } from 'react';
import { Card } from './card';
import type { GameState } from '@shared/game-types';
import { cn } from '@/lib/utils';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  BarChart3,
  RotateCcw,
} from 'lucide-react';

interface SettlementViewProps {
  gameState: GameState;
  onStartNewRound: () => void;
}

export function SettlementView({ gameState, onStartNewRound }: SettlementViewProps) {
  if (!gameState.settlement) return null;
  
  const { settlement } = gameState;
  const caller = gameState.players[settlement.callerIdx];
  const callerTotal = settlement.totals[settlement.callerIdx];
  const wasSuccessful = settlement.payouts[settlement.callerIdx] > 0;
  
  // Find the winning player(s) - those with the lowest total
  const lowestTotal = Math.min(...settlement.totals);
  const winningPlayers = gameState.players.filter((_, index) => 
    settlement.totals[index] === lowestTotal
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center pt-8">
      {/* Settlement Canvas Card */}
      <div className="w-full bg-surface-cream rounded-3xl card-shadow overflow-hidden p-6 md:p-10 border border-border relative text-foreground">
        <div className="relative z-10 text-center space-y-10">
          
          {/* Header Section */}
          <div className="space-y-2">
            <div className="flex justify-center mb-4 text-action-emerald">
              <Trophy className="h-12 w-12 text-victory-gold animate-bounce" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold text-primary">Round settlement</h1>
            <div className="inline-block px-6 py-2 bg-muted rounded-full border border-border">
              <p className="font-display text-sm font-semibold text-primary">
                {caller.name} called with <span className="font-bold">{callerTotal} points</span>.{' '}
                <span className={cn("font-extrabold", wasSuccessful ? "text-action-emerald" : "text-loss-crimson")}>
                  {wasSuccessful ? 'Successful call' : 'Call missed the mark'}
                </span>
              </p>
            </div>
          </div>

          {/* Result Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {gameState.players.map((player, index) => {
              const payout = settlement.payouts[index];
              const isCaller = index === settlement.callerIdx;
              const isPositive = payout > 0;
              const isNegative = payout < 0;

              return (
                <div 
                  key={player.id} 
                  className={cn(
                    "p-6 sm:p-8 rounded-2xl shadow-sm hover:scale-[1.02] transition-transform duration-300 border",
                    isPositive 
                      ? "bg-white border-action-emerald/30" 
                      : isNegative 
                      ? "bg-white border-loss-crimson/30"
                      : "bg-muted border-border"
                  )}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold",
                      isPositive ? "bg-action-emerald" : isNegative ? "bg-loss-crimson" : "bg-secondary"
                    )}>
                      {player.name[0]?.toUpperCase()}
                    </div>
                    <div className="text-center">
                      <h3 className="font-display font-semibold text-primary">
                        {player.name}
                        {isCaller && <span className="text-xs text-muted-foreground font-normal"> - caller</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Hand total <span className="font-bold text-foreground">{settlement.totals[index]} points</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "text-4xl font-extrabold flex items-center gap-2 font-mono",
                        isPositive ? "text-action-emerald" : isNegative ? "text-loss-crimson" : "text-muted-foreground"
                      )}>
                        {isPositive ? (
                          <TrendingUp className="h-6 w-6 text-action-emerald" />
                        ) : isNegative ? (
                          <TrendingDown className="h-6 w-6 text-loss-crimson" />
                        ) : (
                          <MinusCircle className="h-6 w-6 text-muted-foreground" />
                        )}
                        {payout > 0 ? '+' : ''}{payout}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
                        {isCaller
                          ? wasSuccessful ? 'Call paid off' : 'Call backfired'
                          : payout > 0
                          ? 'Collected chips'
                          : payout < 0
                          ? 'Paid out'
                          : 'No change'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running Totals Bento Style */}
          <div className="bg-white border border-border rounded-2xl p-6 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-6 text-victory-gold">
              <BarChart3 className="h-5 w-5 text-victory-gold" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Running totals</h4>
            </div>
            <div className="flex justify-around items-end min-h-[120px] px-4 gap-4">
              {gameState.players.map((player, index) => {
                const isPositive = player.chipDelta >= 0;
                // Calculate scale height (max 96px, min 12px)
                const absDelta = Math.abs(player.chipDelta);
                const heightVal = Math.max(12, Math.min(96, absDelta * 12));

                return (
                  <div key={player.id} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-primary truncate max-w-[80px]">{player.name}</span>
                    <div 
                      style={{ height: `${heightVal}px` }}
                      className={cn(
                        "w-12 sm:w-16 rounded-t-lg transition-all duration-1000 ease-out shadow-inner",
                        isPositive ? "bg-action-emerald" : "bg-loss-crimson"
                      )} 
                    />
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      isPositive ? "text-action-emerald" : "text-loss-crimson"
                    )}>
                      {player.chipDelta > 0 ? '+' : ''}{player.chipDelta}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winning Hand Detail */}
          <div className="space-y-6 pt-4 border-t border-border">
            <div className="flex flex-col items-center gap-2">
              <h4 className="font-display text-xl font-bold text-primary">
                {winningPlayers.length === 1 ? 'Winning hand' : 'Winning hands'}{' '}
                <span className="text-muted-foreground font-normal text-base">({lowestTotal} points)</span>
              </h4>
              <p className="text-xs font-bold text-action-emerald uppercase tracking-widest">
                {winningPlayers.map(p => p.name).join(', ')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {winningPlayers.map(winningPlayer => (
                <div key={winningPlayer.id} className="text-center">
                  <div className="flex justify-center gap-2">
                    {winningPlayer.hand.map((card, cardIndex) => (
                      <Card key={cardIndex} card={card} size="sm" className="shadow-lg border border-border hover:-translate-y-2 transition-transform duration-200" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6">
            <button 
              onClick={onStartNewRound}
              className="bg-action-emerald hover:brightness-110 text-white font-display font-semibold text-lg px-12 py-5 rounded-2xl chunky-button transition-all duration-200 flex items-center gap-3 mx-auto hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Start new round
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
