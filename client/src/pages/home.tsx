import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/card'; // We can use the Card component we wrote!
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGameSocket } from '@/hooks/use-game-socket';
import {
  RotateCcw,
  Sparkles,
  PlusCircle,
  UserPlus,
  GitBranch,
  CheckCircle2,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const { createRoom, joinRoom, roomCode, clearRoom } = useGameSocket();

  useEffect(() => {
    if (!roomCode) {
      localStorage.removeItem('furious-five-room-code');
      localStorage.removeItem('furious-five-player-id');
    }
  }, [roomCode]);

  const handleReset = () => {
    clearRoom();
    localStorage.clear();
    setPlayerName('');
    setJoinRoomCode('');
  };

  useEffect(() => {
    if (roomCode) {
      const timer = setTimeout(() => {
        setLocation('/game');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [roomCode, setLocation]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;

    const name = playerName.trim();
    localStorage.setItem('playerName', name);

    try {
      createRoom(name);

      setTimeout(async () => {
        if (!roomCode) {
          try {
            const response = await fetch('/api/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerName: name }),
            });

            const data = await response.json();
            if (data.success) {
              localStorage.setItem('furious-five-room-code', data.roomCode);
              localStorage.setItem('furious-five-player-id', data.playerId);
              setLocation('/game');
            } else {
              console.error('HTTP room creation failed:', data.error);
            }
          } catch (error) {
            console.error('HTTP room creation error:', error);
          }
        }
      }, 3000);
    } catch (error) {
      console.error('Room creation error:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !joinRoomCode.trim()) return;

    const name = playerName.trim();
    const code = joinRoomCode.trim().toUpperCase();

    try {
      joinRoom(code, name);

      setTimeout(async () => {
        const currentRoomCode = localStorage.getItem('furious-five-room-code');
        if (!currentRoomCode || currentRoomCode !== code) {
          try {
            const response = await fetch(`/api/rooms/${code}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerName: name }),
            });

            const data = await response.json();
            if (data.success) {
              localStorage.setItem('furious-five-room-code', code);
              localStorage.setItem('furious-five-player-id', data.playerId);
              setLocation('/game');
            } else {
              alert(`Failed to join room: ${data.error}`);
            }
          } catch (error) {
            console.error('HTTP room join error:', error);
            alert('Failed to join room. Please check the room code and try again.');
          }
        }
      }, 3000);
    } catch (error) {
      console.error('Room join error:', error);
    }
  };

  const previewCards = [
    { r: 1, s: 'H' },  // A of Hearts
    { r: 4, s: 'S' },  // 4 of Spades
    { r: 4, s: 'C' },  // 4 of Clubs
    { r: 7, s: 'D' },  // 7 of Diamonds
    { r: 13, s: 'H' }  // K of Hearts
  ] as const;

  return (
    <div className="bg-felt-green felt-texture min-h-screen text-white select-none flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-8 px-6 py-6 sm:px-8 lg:px-10 xl:px-14">
        
        {/* Premium Header */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-surface-cream p-2.5 rounded-xl shadow-md flex items-center justify-center">
              <span className="font-display font-extrabold text-3xl tracking-tighter text-victory-gold leading-none">Furious Five</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="h-6 border-action-emerald/25 bg-action-emerald/20 text-action-emerald font-semibold uppercase tracking-wider text-[10px]">Live table</Badge>
              </div>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-white/70">
                A fast room-based card table for sharp reads, clean drops, and tense calls under five points.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              data-testid="button-reset-app"
              className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
            >
              <RotateCcw className="h-4 w-4" />
              Reset app
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="grid flex-1 items-start gap-8 xl:grid-cols-[minmax(520px,0.86fr)_minmax(620px,1.14fr)]">
          <div className="flex max-w-[680px] flex-col gap-6 xl:max-w-none">
            
            {/* Create & Join private rooms */}
            <motion.div
              className="grid gap-5 md:grid-cols-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {/* Create Room */}
              <div className="glass-card border border-white/25 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between h-full gap-4 text-foreground">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-display font-extrabold text-primary">
                    <PlusCircle className="h-5 w-5 text-victory-gold" />
                    Create a room
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Host a private table and invite players with a room code.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-name" className="text-primary font-mono text-[10px] font-bold uppercase tracking-widest">Your name</Label>
                    <Input
                      id="create-name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      data-testid="input-player-name"
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary font-mono rounded-xl"
                    />
                  </div>

                  {!roomCode ? (
                    <button
                      onClick={handleCreateRoom}
                      disabled={!playerName.trim()}
                      data-testid="button-create-room"
                      className="w-full chunky-button bg-action-emerald hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3.5 rounded-xl shadow-[0_4px_0_0_#064e3b] transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="h-5 w-5" />
                      Create room
                    </button>
                  ) : (
                    <div className="space-y-2 rounded-xl border border-action-emerald/30 bg-action-emerald/10 p-4 text-center">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-action-emerald">Room created</div>
                      <div className="font-display text-xl font-bold tracking-widest text-primary">{roomCode}</div>
                      <div className="flex items-center justify-center gap-2 text-xs text-primary/70">
                        <Sparkles className="h-3 w-3 text-victory-gold animate-spin-slow" />
                        Joining lobby...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Room */}
              <div className="glass-card border border-white/25 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between h-full gap-4 text-foreground">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-display font-extrabold text-primary">
                    <UserPlus className="h-5 w-5 text-victory-gold" />
                    Join a room
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Enter a code from your host and land in the lobby.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="join-name" className="text-primary font-mono text-[10px] font-bold uppercase tracking-widest">Your name</Label>
                    <Input
                      id="join-name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      data-testid="input-join-name"
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary font-mono rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="room-code" className="text-primary font-mono text-[10px] font-bold uppercase tracking-widest">Room code</Label>
                    <Input
                      id="room-code"
                      placeholder="FF-XXXXXX"
                      value={joinRoomCode}
                      onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())}
                      data-testid="input-room-code"
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary font-mono rounded-xl tracking-widest"
                    />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    disabled={!playerName.trim() || !joinRoomCode.trim()}
                    data-testid="button-join-room"
                    className="w-full chunky-button bg-action-emerald hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3.5 rounded-xl shadow-[0_4px_0_0_#064e3b] transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    Join room
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Table Flow */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold tracking-wider font-mono uppercase text-victory-gold">
                <GitBranch className="h-5 w-5 text-victory-gold" />
                Table flow
              </div>
              <Separator className="my-4 bg-white/10" />
              <div className="grid gap-4 text-xs sm:text-sm text-white/70 sm:grid-cols-2">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-emerald shrink-0 mt-0.5" />
                  <span>Share the generated room code so friends can jump straight into your lobby.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-action-emerald shrink-0 mt-0.5" />
                  <span>Drop combinations to lower your total, then call before the table catches up.</span>
                </p>
              </div>
            </section>
          </div>

          <aside className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-1">
            {/* Real Felt Surface Preview */}
            <div className="bg-felt-green rounded-[24px] p-6 border-4 border-primary relative overflow-hidden min-h-[360px] flex items-center justify-center table-inner-glow felt-texture text-white shadow-lg">
              <div className="relative z-10 grid w-full max-w-xl gap-5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-victory-gold" />
                    Table preview
                  </span>
                  <span>2-5 players</span>
                </div>
                
                <div className="rounded-2xl border border-white/15 bg-black/20 p-6 shadow-2xl">
                  {/* Render actual card views */}
                  <div className="mb-6 flex justify-center gap-3">
                    {previewCards.map((card, index) => (
                      <Card 
                        key={index} 
                        card={card} 
                        size="sm" 
                        className="shadow-xl transform rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-200" 
                      />
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                      <div className="font-bold text-victory-gold uppercase text-[10px] font-mono tracking-wider">Drop</div>
                      <div className="text-white/60 text-[10px] mt-1">Pair / straight</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                      <div className="font-bold text-victory-gold uppercase text-[10px] font-mono tracking-wider">Draw</div>
                      <div className="text-white/60 text-[10px] mt-1">Deck / table</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                      <div className="font-bold text-victory-gold uppercase text-[10px] font-mono tracking-wider">Call</div>
                      <div className="text-white/60 text-[10px] mt-1">Under 5 points</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learn the table panel */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-victory-gold">
                <BookOpen className="h-5 w-5 text-victory-gold" />
                Learn the table
              </h2>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="rules" className="border-white/10">
                  <AccordionTrigger className="text-left text-sm font-semibold text-white/90 hover:no-underline hover:text-victory-gold transition-colors">
                    Basic rules
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 text-xs leading-relaxed space-y-2 pt-2">
                    <p>• Each player starts with five cards.</p>
                    <p>• Goal: bring your hand total under five points.</p>
                    <p>• Card values: A=1, 2-10 face value, J=11, Q=12, K=13.</p>
                    <p>• Call when your total drops below five to trigger settlement.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="plays" className="border-b-0">
                  <AccordionTrigger className="text-left text-sm font-semibold text-white/90 hover:no-underline hover:text-victory-gold transition-colors">
                    Valid drops
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 text-xs leading-relaxed space-y-2 pt-2">
                    <p>• Single: any individual card.</p>
                    <p>• Pair, trips, and quads: same-rank sets.</p>
                    <p>• Straight: three or more consecutive ranks.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
