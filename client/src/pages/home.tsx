import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGameSocket } from '@/hooks/use-game-socket';
import {
  ArrowRight,
  CopyCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CreateRoomIcon,
  JoinRoomIcon,
  RoomCodeIcon,
  TableFeltIcon,
  DropCardIcon,
} from '@/components/icons/Furious5Icons';
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
              localStorage.setItem('roomCode', data.roomCode);
              localStorage.setItem('playerId', data.playerId);
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
        const currentRoomCode = localStorage.getItem('roomCode');
        if (!currentRoomCode || currentRoomCode !== code) {
          try {
            const response = await fetch(`/api/rooms/${code}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerName: name }),
            });

            const data = await response.json();
            if (data.success) {
              localStorage.setItem('roomCode', code);
              localStorage.setItem('playerId', data.playerId);
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

  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 xl:px-14">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg">
              <img src="/icons/furious5-app-icon.svg" alt="" className="h-12 w-12" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold sm:text-5xl">Furious Five</h1>
                <Badge variant="outline" className="h-6 border-primary/25 bg-primary/5 text-primary">Live table</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
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
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset app
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 xl:grid-cols-[minmax(520px,0.86fr)_minmax(620px,1.14fr)]">
          <div className="flex max-w-[680px] flex-col gap-6 xl:max-w-none">
            <motion.div
              className="grid gap-5 md:grid-cols-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Card className="h-full">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreateRoomIcon className="h-5 w-5 text-primary" />
                    Create a room
                  </CardTitle>
                  <CardDescription>Host a private table and invite players with a room code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">Your name</Label>
                    <Input
                      id="create-name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      data-testid="input-player-name"
                    />
                  </div>

                  {!roomCode ? (
                    <Button
                      className="w-full"
                      onClick={handleCreateRoom}
                      disabled={!playerName.trim()}
                      data-testid="button-create-room"
                      size="lg"
                    >
                      <CreateRoomIcon className="h-4 w-4" />
                      Create room
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
                      <div className="text-xs font-semibold uppercase text-primary">Room created</div>
                      <div className="font-mono text-xl font-semibold text-primary">{roomCode}</div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        Joining lobby...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <JoinRoomIcon className="h-5 w-5 text-primary" />
                    Join a room
                  </CardTitle>
                  <CardDescription>Enter a code from your host and land in the lobby.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="join-name">Your name</Label>
                    <Input
                      id="join-name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      data-testid="input-join-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-code">Room code</Label>
                    <Input
                      id="room-code"
                      placeholder="FF-XXXXXX"
                      value={joinRoomCode}
                      onChange={(event) => setJoinRoomCode(event.target.value.toUpperCase())}
                      data-testid="input-room-code"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleJoinRoom}
                    disabled={!playerName.trim() || !joinRoomCode.trim()}
                    data-testid="button-join-room"
                    size="lg"
                  >
                    <JoinRoomIcon className="h-4 w-4" />
                    Join room
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <section className="table-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <RoomCodeIcon className="h-4 w-4 text-primary" />
                Table flow
              </div>
              <Separator className="my-4" />
              <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                <p className="flex items-start gap-2">
                  <CopyCheck className="mt-0.5 h-4 w-4 text-primary" />
                  Share the generated room code so friends can jump straight into your lobby.
                </p>
                <p className="flex items-start gap-2">
                  <DropCardIcon className="mt-0.5 h-4 w-4 text-primary" />
                  Drop combinations to lower your total, then call before the table catches up.
                </p>
              </div>
            </section>
          </div>

          <aside className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-1">
            <div className="felt-surface felt-ring relative flex min-h-[440px] items-center justify-center p-6 text-white lg:min-h-[460px] xl:min-h-[560px]">
              <div className="relative z-10 grid w-full max-w-xl gap-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-white/70">
                  <span className="flex items-center gap-2"><TableFeltIcon className="h-4 w-4" /> Table preview</span>
                  <span>2-5 players</span>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/20 p-6 shadow-2xl">
                  <div className="mb-6 flex justify-center gap-3">
                    {['A', '4', '4', '7', 'K'].map((rank, index) => (
                      <div key={`${rank}-${index}`} className="grid h-28 w-20 place-items-center rounded-md border border-zinc-200 bg-white text-2xl font-bold text-zinc-950 shadow-xl">
                        {rank}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-md bg-white/10 px-3 py-4">
                      <div className="font-semibold text-white">Drop</div>
                      <div className="text-white/60">Pair / straight</div>
                    </div>
                    <div className="rounded-md bg-white/10 px-3 py-4">
                      <div className="font-semibold text-white">Draw</div>
                      <div className="text-white/60">Deck / table</div>
                    </div>
                    <div className="rounded-md bg-white/10 px-3 py-4">
                      <div className="font-semibold text-white">Call</div>
                      <div className="text-white/60">Under five</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="table-panel p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-accent" />
                Learn the table
              </h2>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="rules">
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                    Basic rules
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Each player starts with five cards.</li>
                      <li>Goal: bring your hand total under five points.</li>
                      <li>Card values: A=1, 2-10 face value, J=11, Q=12, K=13.</li>
                      <li>Call when your total drops below five to trigger settlement.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="plays">
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                    Valid drops
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Single: any individual card.</li>
                      <li>Pair, trips, and quads: same-rank sets.</li>
                      <li>Straight: three or more consecutive ranks.</li>
                    </ul>
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
