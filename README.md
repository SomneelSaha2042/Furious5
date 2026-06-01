# Furious Five

Productionized real-time multiplayer WebSocket system with Redis-backed state, safe room mutations, reconnect recovery, health checks, Docker deployment, and load testing.

This repo is a TypeScript full-stack application used to run a low-latency multiplayer room system. The domain is a card-table experience, but the engineering focus is the real-time architecture: WebSocket session coordination, Redis persistence, race-safe state transitions, restart recovery, and production deployment on Railway.

## Production Architecture

```text
Browser clients
  -> React frontend
  -> WebSocket events over /ws
  -> Express Node service
     -> serves static React build
     -> owns in-process WebSocket connection maps
     -> validates and applies game/room mutations
     -> persists room state in Redis when REDIS_URL is set
     -> exposes health and metrics endpoints
```

Current production target:

```text
1 Dockerized Node service
1 Redis service
1 app replica
```

In-memory storage is a local-development fallback only. Production state is Redis-backed.

## Key Capabilities

- WebSocket server using `ws` at `/ws`
- Redis-backed room state persistence for production
- Local `MemStorage` fallback when `REDIS_URL` is not set
- Per-room mutation safety through `storage.mutateRoom(...)`
- Redis token-based room locks to prevent stale concurrent writes
- Reconnect recovery using saved `roomCode` and `playerId`
- Room TTL refresh and active-room tracking in Redis
- Runtime health checks with Redis status, active rooms, active sockets, memory, and uptime
- Docker-first production deployment for Railway
- Configurable WebSocket load test for roughly 100 concurrent users

## What This Demonstrates

- Productionizing a real-time WebSocket app beyond a purely in-memory prototype
- Designing a storage abstraction that supports local development and Redis production mode
- Preventing race conditions in room-based multiplayer state with mutation locks
- Preserving room state across app restarts and reconnects
- Instrumenting a Node service with operational health and load-test visibility
- Deploying a single-service React + Express app through a production Dockerfile

## Stack

Frontend:

- React 18
- TypeScript
- Tailwind CSS and shadcn/ui
- Framer Motion
- Wouter

Backend:

- Node.js 20
- Express
- `ws` WebSocket server
- Redis production storage
- Zod validation
- Helmet, CORS, compression, and rate limiting

Build and deployment:

- Vite frontend build
- esbuild server bundle
- Multi-stage Dockerfile
- Railway-compatible `PORT` handling

## Runtime Storage

Storage is selected at startup:

```ts
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

All important state changes go through:

```ts
storage.mutateRoom(roomCode, mutator)
```

That gives the app one safe mutation path for room joins, ready state changes, turn actions, reconnect status updates, and delayed disconnect handling.

## WebSocket Flow

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

WebSocket connections stay in memory:

```ts
Map<roomCode, Set<WebSocket>>
```

This keeps single-replica broadcasts simple and fast. It also means multi-replica deployment is intentionally not enabled yet.

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

## Production Deployment

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

Default production-readiness profile:

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

## Scaling Notes

Current safe production shape:

```text
1 Node service replica
1 Redis service
Redis room state
in-memory WebSocket connection map
```

Do not run multiple app replicas yet. Room state is shared through Redis, but WebSocket broadcasts are still local to the process. Multi-replica support needs Redis Pub/Sub or another distributed fanout layer.

## License

MIT
