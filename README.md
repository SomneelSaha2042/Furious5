# Furious Five

<p align="center">
  <img src="assets/F5.png" alt="Furious Five icon" width="140" />
</p>

<p align="center">
  <strong>A real-time multiplayer card table built with React, Express, WebSockets, and Redis-ready room state.</strong>
</p>

<p align="center">
  <a href="https://github.com/SomneelSaha2042/Furious5/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/SomneelSaha2042/Furious5/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/SomneelSaha2042/Furious5/actions/workflows/build.yml"><img alt="Build and Test" src="https://github.com/SomneelSaha2042/Furious5/actions/workflows/build.yml/badge.svg" /></a>
  <a href="https://github.com/SomneelSaha2042/Furious5/actions/workflows/docker-build.yml"><img alt="Docker" src="https://github.com/SomneelSaha2042/Furious5/actions/workflows/docker-build.yml/badge.svg" /></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-2%20passing-brightgreen" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

## About

Furious Five is a low-latency, room-based card game designed around quick table reads, clean card drops, reconnect-safe multiplayer sessions, and a polished felt-table interface. Players create private rooms, invite friends with a room code, ready up in the lobby, and play through fast rounds where every drop, draw, and call can swing the settlement.

The project is also a production-minded realtime systems exercise. It keeps the game approachable on the surface while exercising practical infrastructure concerns underneath: WebSocket session coordination, resilient room mutations, Redis-backed persistence, health checks, Docker deployment, and CI-backed validation.

## Project Bio

Furious Five started as a focused multiplayer card-table experiment and has grown into a full-stack realtime app. The experience aims to feel immediate and tactile: a private table, five-card hands, clear turn cues, fast reconnects, and enough backend discipline to keep state consistent when multiple players act around the same room.

The codebase is intentionally small enough to understand end to end, but structured like a deployable service rather than a throwaway prototype.

## Gameplay Snapshot

- 2-5 players join a private room.
- Each player starts with five cards.
- Card values are `A=1`, `2-10` face value, `J=11`, `Q=12`, and `K=13`.
- Players drop singles, pairs, trips, quads, or straights of three or more cards.
- After dropping, a player draws from the deck or from the table when allowed.
- A player can call when their hand total is low enough to trigger settlement.
- Settlement compares hand totals and applies chip deltas for the round.

The executable source of truth for gameplay lives in [shared/game-engine.ts](shared/game-engine.ts).

## Current Validation

Last local verification:

```text
npm run check                         passing
npx tsx --test server/room-join.test.ts  2 passing tests
```

Current focused tests cover:

- Same-name lobby rejoin reclaiming the original player.
- New-name lobby join adding a new player.

The GitHub Actions workflows also run type checking, production builds, artifact checks, and Docker image builds.

## Features

- Realtime multiplayer over WebSockets at `/ws`.
- Private room creation and joining with short room codes.
- Lobby ready state and game start flow.
- Reconnect recovery using persisted room and player session IDs.
- Shared game engine for deterministic state transitions.
- Per-room mutation safety through `storage.mutateRoom(...)`.
- Redis-backed room persistence when `REDIS_URL` is configured.
- Local in-memory storage fallback for development.
- Runtime health endpoints with room, socket, Redis, memory, and uptime metrics.
- Docker-first deployment path for Railway and other container hosts.

## Tech Stack

Frontend:

- React 18
- TypeScript
- Vite
- Tailwind CSS and shadcn/ui
- Framer Motion
- Wouter

Backend:

- Node.js 20+
- Express
- `ws` WebSocket server
- Redis-ready storage adapter
- Zod validation
- Helmet, CORS, compression, and rate limiting

Build and deployment:

- Vite frontend build
- esbuild server bundle
- Multi-stage Dockerfile
- GitHub Actions CI
- Railway-compatible `PORT` handling

## Architecture

```text
Browser clients
  -> React frontend
  -> WebSocket events over /ws
  -> Express Node service
     -> serves the React app
     -> owns in-process WebSocket connection maps
     -> validates and applies game mutations
     -> persists room state in Redis when REDIS_URL is set
     -> exposes health and metrics endpoints
```

Current deployment target:

```text
1 Dockerized Node service
1 Redis service
1 app replica
```

Multi-replica deployment is not enabled yet. Room state can live in Redis, but live WebSocket broadcasts are still local to the process. Scaling beyond one app replica needs Redis Pub/Sub or another distributed fanout layer.

## Runtime Storage

Storage is selected at startup:

```text
REDIS_URL set    -> RedisStorage
REDIS_URL absent -> MemStorage
```

Redis stores:

```text
room:{roomCode}      JSON serialized room state
rooms:active         active room code set
roomlock:{roomCode}  short-lived mutation lock
```

Defaults:

```text
ROOM_TTL_SECONDS=14400
REDIS_LOCK_TTL_MS=5000
REDIS_LOCK_TIMEOUT_MS=2000
```

Important room changes go through:

```ts
storage.mutateRoom(roomCode, mutator)
```

That gives the app one mutation path for joins, ready state changes, turn actions, reconnect status updates, and delayed disconnect handling.

## WebSocket Contract

Clients connect to:

```text
/ws
```

Common client events:

```text
room:create
room:join
player:ready
game:start
turn:call
turn:drop
turn:drawDeck
turn:drawFromTable
round:new
game:getState
ping
```

Common server events:

```text
room:created
room:joined
state:update
notification
error
pong
```

## Health Checks

Endpoints:

```text
/health
/api/health
```

Example response:

```json
{
  "status": "healthy",
  "redis": "connected",
  "activeRooms": 3,
  "activeSockets": 12,
  "messagesReceived": 240,
  "messagesSent": 520,
  "roomsCreated": 4,
  "uptime": 1800,
  "memoryMb": 140,
  "heapUsedMb": 45
}
```

If Redis cannot be queried, health returns `status: "degraded"` and includes Redis error context when available.

## Project Structure

```text
client/src/              React app
client/public/icons/     Web app icons and PWA assets
server/index.ts          Express entrypoint, middleware, /health
server/routes.ts         API routes and WebSocket handlers
server/storage/          MemStorage, RedisStorage, mutation API
server/metrics.ts        Runtime metrics snapshot
shared/game-engine.ts    State transition logic
shared/game-types.ts     Shared TypeScript types and Zod schemas
scripts/build.mjs        Production build script
scripts/load-ws.ts       WebSocket load-test script
Dockerfile               Production container build
RAILWAY_DEPLOYMENT.md    Railway + Redis deployment guide
```

## Local Development

Prerequisites:

- Node.js 20+
- npm

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5000
```

Local development uses `MemStorage` unless `REDIS_URL` is set.

## Scripts

```bash
npm run dev       # Start the development server
npm run check     # TypeScript check
npm run build     # Build client and server into dist/
npm start         # Run the production build
npm run load:ws   # Run the WebSocket load test
```

Docker helpers:

```bash
npm run docker:build
npm run docker:run
npm run docker:logs
npm run docker:stop
```

## Environment Variables

```text
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://...
ROOM_TTL_SECONDS=14400
REDIS_LOCK_TTL_MS=5000
REDIS_LOCK_TIMEOUT_MS=2000
```

`REDIS_URL` is the switch between local fallback storage and production Redis persistence.

## Deployment

Railway is the primary documented deployment path. Use the root `Dockerfile`; do not configure separate Railway build/start commands unless intentionally moving away from Docker.

Railway app variables:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-app.up.railway.app
ROOM_TTL_SECONDS=14400
REDIS_URL=${{Redis.REDIS_URL}}
```

Keep app replicas at:

```text
1
```

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for the full setup.

Generic Docker run:

```bash
docker build -t furious5:latest .
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://yourdomain.com \
  -e REDIS_URL=redis://your-redis-url \
  --name furious5-app \
  furious5:latest
```

## Load Testing

Default heavier local/Railway test profile:

```text
20 rooms
5 clients per room
100 connected WebSocket clients
```

Run:

```bash
npm run load:ws -- --url=wss://your-app.up.railway.app/ws --rooms=20 --players=5 --durationMs=600000
```

Watch:

- Error count
- Disconnect count
- p95 latency
- Redis status
- Memory usage

## License

MIT
