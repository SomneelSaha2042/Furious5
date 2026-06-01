import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import type { GameState } from '@shared/game-types';
import { LobbyView } from '@/components/lobby-view';
import { GameTableView } from '@/components/game-table-view';
import { SettlementView } from '@/components/settlement-view';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGameSocket } from '@/hooks/use-game-socket';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Loader2, ShieldQuestion } from 'lucide-react';
import {
  ReconnectIcon,
  RoomCodeIcon,
  SocketLiveIcon,
} from '@/components/icons/Furious5Icons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function Game() {
  const [, setLocation] = useLocation();
  const { 
    gameState, 
    playerId, 
    roomCode, 
    isConnected,
    toggleReady,
    startGame,
    call,
    dropCards,
    drawFromDeck,
    drawFromTable,
    startNewRound,
    requestGameState,
    clearRoom,
    staleSession,
    markSessionAsStale,
  } = useGameSocket();
  
  // Simplified: Just show what we have or redirect home
  useEffect(() => {
    if (!roomCode && !playerId) {
      // No room info, go home
      const timer = setTimeout(() => setLocation('/'), 1000);
      return () => clearTimeout(timer);
    }
  }, [roomCode, playerId, setLocation]);
  
  // Redirect to home if not in a room (with delay to allow socket to connect)
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roomCode || !playerId) {
        setShouldRedirect(true);
      }
    }, 2000); // Give 2 seconds for connection to establish
    
    return () => clearTimeout(timer);
  }, [roomCode, playerId]);
  
  useEffect(() => {
    if (shouldRedirect) {
      setLocation('/');
    }
  }, [shouldRedirect, setLocation]);
  
  // Show loading while checking connection
  if (!roomCode || !playerId) {
    return (
      <div className="app-backdrop flex min-h-screen items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to game...</p>
        </div>
      </div>
    );
  }
  
  // Try to fetch room state via HTTP if WebSocket isn't working
  const [httpGameState, setHttpGameState] = useState<GameState | null>(null);
  
  useEffect(() => {
    if (!gameState && roomCode) {
      // Try fetching room state via HTTP
      const fetchRoomState = async () => {
        try {
          console.log('Fetching room state via HTTP for room:', roomCode);
          const response = await fetch(`/api/rooms/${roomCode}`);
          const data = await response.json();
          
          if (data.success && data.gameState) {
            console.log('Successfully fetched room state via HTTP');
            setHttpGameState(data.gameState);
          } else {
            console.log('HTTP fetch failed:', data.error);
            if (response.status === 404 || data.error === 'Room not found') {
              markSessionAsStale();
            }
          }
        } catch (error) {
          console.error('Error fetching room state via HTTP:', error);
        }
      };
      
      // Wait a bit for WebSocket, then try HTTP
      const timer = setTimeout(fetchRoomState, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, roomCode, markSessionAsStale]);

  // Use WebSocket game state if available, otherwise use HTTP state, otherwise mock state
  const fallbackGameState = useMemo<GameState>(() => ({
    roomCode: roomCode || 'FF-TEST',
    phase: 'lobby',
    players: [
      {
        id: playerId || 'player1',
        name: 'You',
        connected: true,
        ready: false,
        hand: [],
        chipDelta: 0,
      },
    ],
    turnIdx: 0,
    turnStage: 'start',
    deck: [],
    graveyard: [],
    tableDrop: null,
    pendingDrop: null,
    settlement: null,
    version: 0,
    roundNumber: 1,
    gameStartTime: Date.now(),
  }), [roomCode, playerId]);

  const effectiveGameState = gameState || httpGameState || fallbackGameState;

  if (!gameState && !httpGameState) {
    console.log('No gameState available. roomCode:', roomCode, 'playerId:', playerId);
    console.log('Using mock state for testing...');
  } else if (!gameState && httpGameState) {
    console.log('Using HTTP-fetched game state');
  }
  
  const connectionLabel = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="app-backdrop min-h-screen">
      <AlertDialog open={staleSession} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session inactive</AlertDialogTitle>
            <AlertDialogDescription>
              This game session is no longer active. To go back to /main leave this game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                clearRoom();
                setLocation('/');
              }}
            >
              Leave Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 xl:px-14">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg">
              <img src="/icons/furious5-app-icon.svg" alt="" className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Furious Five</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RoomCodeIcon className="h-4 w-4" />
                  <span className="font-mono font-semibold" data-testid="room-code">
                    {roomCode}
                  </span>
                </span>
                <Badge variant="outline" className="flex items-center gap-2 text-xs">
                  <SocketLiveIcon className={isConnected ? 'h-3.5 w-3.5 text-primary' : 'h-3.5 w-3.5 text-destructive'} />
                  <span data-testid="connection-indicator">{connectionLabel}</span>
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                clearRoom();
                setLocation('/');
              }}
              data-testid="button-leave-game"
              className="flex items-center gap-2"
            >
              <DoorOpen className="h-4 w-4" />
              Leave game
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          <div className="flex-1">
            {effectiveGameState.phase === 'lobby' && (
              <LobbyView
                gameState={effectiveGameState}
                playerId={playerId || ''}
                onStartGame={startGame}
                onToggleReady={toggleReady}
              />
            )}

            {effectiveGameState.phase === 'playing' && (
              <GameTableView
                gameState={effectiveGameState}
                playerId={playerId}
                onCall={call}
                onDropCards={dropCards}
                onDrawFromDeck={drawFromDeck}
                onDrawFromTable={drawFromTable}
              />
            )}

            {effectiveGameState.phase === 'settlement' && (
              <SettlementView
                gameState={effectiveGameState}
                onStartNewRound={startNewRound}
              />
            )}
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="debug">
              <AccordionTrigger className="text-sm font-semibold text-muted-foreground">
                Debug utilities
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <ShieldQuestion className="h-4 w-4" />
                  If things look out of sync, use these helpers.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => requestGameState?.()}
                  >
                    <ReconnectIcon className="h-4 w-4" />
                    Request latest state
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      clearRoom();
                      setLocation('/');
                    }}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Force leave & reset
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </div>
    </div>
  );
}
