import { Button } from '@/components/ui/button';
import { Card } from './card';
import type { GameState } from '@shared/game-types';
import { Award, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChipStackIcon, ShowdownIcon } from '@/components/icons/Furious5Icons';

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
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="table-panel p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center">
            <ShowdownIcon className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-semibold" data-testid="settlement-title">
            Round settlement
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground" data-testid="caller-name">{caller.name}</span>
            {' '}called with
            {' '}
            <span className="font-semibold text-primary" data-testid="caller-total">{callerTotal}</span>
            {' '}points
          </p>
          <p className={cn('mt-1 text-sm font-semibold', wasSuccessful ? 'text-primary' : 'text-destructive')}>
            {wasSuccessful ? 'Successful call' : 'Call missed the mark'}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gameState.players.map((player, index) => {
            const payout = settlement.payouts[index];
            const isCaller = index === settlement.callerIdx;
            const payoutTone = payout > 0 ? 'text-primary' : payout < 0 ? 'text-destructive' : 'text-muted-foreground';

            return (
              <div key={player.id} className="rounded-lg border border-border bg-muted/40 p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className={cn(
                      'grid h-14 w-14 place-items-center rounded-full text-lg font-semibold',
                      isCaller ? (wasSuccessful ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground') : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {player.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold" data-testid={`player-name-${index}`}>
                      {player.name}
                      {isCaller && <span className="text-xs text-muted-foreground"> - caller</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hand total{' '}
                      <span className="font-semibold text-foreground" data-testid={`player-total-${index}`}>
                        {settlement.totals[index]}
                      </span>
                      {' '}points
                    </p>
                  </div>
                  <div className={cn('flex items-center gap-2 text-2xl font-semibold', payoutTone)} data-testid={`player-payout-${index}`}>
                    <ChipStackIcon className="h-5 w-5" />
                    <span>{payout > 0 ? '+' : ''}{payout}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isCaller
                      ? wasSuccessful ? 'Call paid off' : 'Call backfired'
                      : payout > 0
                      ? 'Collected chips'
                      : payout < 0
                      ? 'Paid out'
                      : 'No change'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h3 className="flex items-center justify-center gap-2 text-base font-semibold">
            <Award className="h-5 w-5 text-accent" />
            Running totals
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center md:grid-cols-3 lg:grid-cols-5">
            {gameState.players.map((player, index) => (
              <div key={player.id}>
                <p className="text-xs font-semibold text-muted-foreground" data-testid={`total-player-name-${index}`}>
                  {player.name}
                </p>
                <p
                  className={cn(
                    'text-lg font-semibold',
                    player.chipDelta > 0 ? 'text-primary' : player.chipDelta < 0 ? 'text-destructive' : 'text-foreground'
                  )}
                  data-testid={`total-chips-${index}`}
                >
                  {player.chipDelta > 0 ? '+' : ''}{player.chipDelta}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="mb-6 text-center text-xl font-semibold">
            {winningPlayers.length === 1 ? 'Winning hand' : 'Winning hands'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({lowestTotal} points)</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            {winningPlayers.map(winningPlayer => (
              <div key={winningPlayer.id} className="text-center">
                <p className="mb-3 text-base font-semibold" data-testid={`winner-name-${winningPlayer.id}`}>
                  {winningPlayer.name}
                </p>
                <div className="flex justify-center gap-2" data-testid={`winner-hand-${winningPlayer.id}`}>
                  {winningPlayer.hand.map((card, cardIndex) => (
                    <Card key={cardIndex} card={card} size="sm" className="shadow-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Button onClick={onStartNewRound} data-testid="button-new-round" className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5" />
            Start new round
          </Button>
        </div>
      </div>
    </div>
  );
}
