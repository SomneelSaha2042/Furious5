import { z } from "zod";

// Card types
export type Suit = 'C' | 'D' | 'H' | 'S';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  r: Rank;
  s: Suit;
}

// Drop types
export type DropKind = 'single' | 'pair' | 'trips' | 'quads' | 'straight';

export interface Drop {
  kind: DropKind;
  cards: Card[];
}

// Game types
export type Phase = 'lobby' | 'playing' | 'settlement';
export type TurnStage = 'start' | 'dropped' | 'end';

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  hand: Card[];
  chipDelta: number;
}

export type TableDrop = {
  kind: DropKind;
  cards: Card[];
} | null;

export interface Settlement {
  callerIdx: number;
  totals: number[];
  payouts: number[];
}

export interface GameState {
  roomCode: string;
  phase: Phase;
  players: Player[];
  turnIdx: number;
  turnStage: TurnStage;
  deck: Card[];
  graveyard: Card[];
  tableDrop: TableDrop;
  pendingDrop?: Drop | null;
  settlement?: Settlement | null;
  version: number;
  roundNumber: number;
  gameStartTime: number;
}

// Zod schemas for validation
export const CardSchema = z.object({
  r: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
    z.literal(11),
    z.literal(12),
    z.literal(13)
  ]),
  s: z.enum(['C', 'D', 'H', 'S'])
});

export const DropSchema = z.object({
  kind: z.enum(['single', 'pair', 'trips', 'quads', 'straight']),
  cards: z.array(CardSchema).min(1)
});

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  connected: z.boolean(),
  ready: z.boolean(),
  hand: z.array(CardSchema),
  chipDelta: z.number()
});

// Client-to-Server events
export const JoinRoomSchema = z.object({
  roomCode: z.string(),
  playerName: z.string()
});

export const CreateRoomSchema = z.object({
  playerName: z.string()
});

export const DropCardsSchema = z.object({
  drop: DropSchema
});

export type DropCardsData = z.infer<typeof DropCardsSchema>;

export const DrawFromTableSchema = z.object({
  cardIndex: z.number()
});

// Server-to-Client events
export const GameStateSchema = z.object({
  roomCode: z.string(),
  phase: z.enum(['lobby', 'playing', 'settlement']),
  players: z.array(PlayerSchema),
  turnIdx: z.number(),
  turnStage: z.enum(['start', 'dropped', 'end']),
  deck: z.array(CardSchema),
  graveyard: z.array(CardSchema),
  tableDrop: z.union([
    z.object({
      kind: z.enum(['single', 'pair', 'trips', 'quads', 'straight']),
      cards: z.array(CardSchema)
    }),
    z.null()
  ]),
  pendingDrop: z.union([DropSchema, z.null()]).optional(),
  settlement: z.union([
    z.object({
      callerIdx: z.number(),
      totals: z.array(z.number()),
      payouts: z.array(z.number())
    }),
    z.null()
  ]).optional(),
  version: z.number(),
  roundNumber: z.number(),
  gameStartTime: z.number()
});

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string()
});
