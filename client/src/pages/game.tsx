import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import type { GameState } from '@shared/game-types';
import { LobbyView } from '@/components/lobby-view';
import { GameTableView } from '@/components/game-table-view';
import { SettlementView } from '@/components/settlement-view';
import { BrandMark } from '@/components/brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGameSocket } from '@/hooks/use-game-socket';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, DoorOpen, ShieldQuestion, Hash, LogOut, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  
  useEffect(() => {
    if (!roomCode && !playerId) {
      const timer = setTimeout(() => setLocation('/'), 1000);
      return () => clearTimeout(timer);
    }
  }, [roomCode, playerId, setLocation]);
  
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roomCode || !playerId) {
        setShouldRedirect(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [roomCode, playerId]);
  
  useEffect(() => {
    if (shouldRedirect) {
      setLocation('/');
    }
  }, [shouldRedirect, setLocation]);
  
  if (!roomCode || !playerId) {
    return (
      <div className="bg-felt-green felt-texture flex min-h-screen items-center justify-center px-4 text-white">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-victory-gold" />
          <p className="text-sm font-semibold text-victory-gold/80">Connecting to table...</p>
        </div>
      </div>
    );
  }
  
  const [httpGameState, setHttpGameState] = useState<GameState | null>(null);
  
  useEffect(() => {
    if (!gameState && roomCode) {
      const fetchRoomState = async () => {
        try {
          const response = await fetch(`/api/rooms/${roomCode}`);
          const data = await response.json();
          
          if (data.success && data.gameState) {
            setHttpGameState(data.gameState);
          } else {
            if (response.status === 404 || data.error === 'Room not found') {
              markSessionAsStale();
            }
          }
        } catch (error) {
          console.error('Error fetching room state via HTTP:', error);
        }
      };
      const timer = setTimeout(fetchRoomState, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, roomCode, markSessionAsStale]);
  
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
  const isLobby = effectiveGameState.phase === 'lobby';
  const isPlaying = effectiveGameState.phase === 'playing';
  const isSettlement = effectiveGameState.phase === 'settlement';

  return (
    <div className={cn(
      "min-h-screen text-foreground select-none flex flex-col",
      isLobby && "bg-felt-green felt-texture",
      isPlaying && "bg-surface-cream",
      isSettlement && "bg-felt-green bg-[radial-gradient(circle_at_center,_#0a5c46_0%,_#064e3b_100%)]"
    )}>
      {/* Session Inactive Dialog */}
      <AlertDialog open={staleSession} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session inactive</AlertDialogTitle>
            <AlertDialogDescription>
              This game session is no longer active. To go back to main menu, leave this game.
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

      {/* Dynamic Navigation Bar */}
      <header className={cn(
        "flex justify-between items-center w-full px-6 py-4 z-50 shadow-md transition-all",
        isPlaying 
          ? "bg-felt-green text-white" 
          : "bg-felt-green/95 backdrop-blur-md fixed top-0 left-0 text-white"
      )}>
        <div className="flex items-center gap-4">
          <BrandMark className="h-12 w-12 p-1 rounded-lg shadow-sm" imageClassName="h-full w-full" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/30 rounded-full border border-white/20">
            <Hash className="h-4 w-4 text-victory-gold" />
            <span className="font-mono text-xs font-bold text-white">{roomCode}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-action-emerald/20 rounded-full">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-action-emerald animate-pulse" : "bg-loss-crimson")} />
            <span className={cn("font-mono text-[10px] font-extrabold uppercase", isConnected ? "text-action-emerald" : "text-loss-crimson")}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              clearRoom();
              setLocation('/');
            }}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2 bg-loss-crimson hover:bg-loss-crimson/90 text-white shadow-sm font-bold rounded-xl"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Leave game</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Layout Area */}
      <main className={cn(
        "flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 transition-all",
        isPlaying ? "py-6" : "pt-28 pb-12"
      )}>
        {isLobby && (
          <LobbyView
            gameState={effectiveGameState}
            playerId={playerId || ''}
            onStartGame={startGame}
            onToggleReady={toggleReady}
          />
        )}

        {isPlaying && (
          <GameTableView
            gameState={effectiveGameState}
            playerId={playerId}
            onCall={call}
            onDropCards={dropCards}
            onDrawFromDeck={drawFromDeck}
            onDrawFromTable={drawFromTable}
          />
        )}

        {isSettlement && (
          <SettlementView
            gameState={effectiveGameState}
            onStartNewRound={startNewRound}
          />
        )}

        {/* Collapsible Debug Panel at the bottom */}
        <footer className="mt-12 mb-8 max-w-3xl mx-auto opacity-70 hover:opacity-100 transition-opacity">
          <Accordion type="single" collapsible className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <AccordionItem value="debug" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-xs font-mono font-bold tracking-wider uppercase text-victory-gold hover:no-underline">
                Debug Utilities & Stats
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-3 font-mono text-xs text-white/70">
                <p className="flex items-center gap-2">
                  <ShieldQuestion className="h-4 w-4 text-victory-gold" />
                  Use these helpers to synchronize game state manually.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white"
                    onClick={() => requestGameState?.()}
                  >
                    <RotateCw className="h-3 w-3" />
                    Request latest state
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-white/50 hover:text-white hover:bg-white/5"
                    onClick={() => {
                      clearRoom();
                      setLocation('/');
                    }}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Force Reset & Leave
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </footer>
      </main>
    </div>
  );
}
