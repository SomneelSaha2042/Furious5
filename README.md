# Furious Five

Furious Five is a real-time multiplayer card game for 2-5 players. It is built as a single TypeScript app: React for the frontend, Express for HTTP/static serving, and `ws` for the `/ws` multiplayer channel.

The app runs locally with in-memory room storage. In production, setting `REDIS_URL` switches game state to Redis so rooms can survive app restarts and player reconnects.

## Current Capabilities

- Real-time multiplayer rooms over WebSocket at `/ws`
- React frontend served by the same Express service
- Local development with in-memory `MemStorage`
- Production room persistence with Redis when `REDIS_URL` is configured
- Per-room mutation safety with `storage.mutateRoom(...)`
- Redis room TTLs, reconnect recovery, and active-room tracking
- Health endpoints with Redis status, active rooms, active sockets, memory, and uptime
- Docker-first production deployment, including Railway Hobby
- Configurable WebSocket load test for roughly 100 concurrent clients

The current production target is one app replica. Do not scale to multiple replicas until WebSocket fanout is moved to Redis Pub/Sub or another distributed adapter.

## Game Overview

Furious Five is a fast card game where players try to reduce their hand total and call at the right moment.

Rules:

- Each player starts with 5 cards.
- Ace is worth 1; numbered cards are face value; J/Q/K are 11/12/13.
- On your turn, drop a valid card set, then draw from the deck or table.
- You can call when your hand total is 5 or less.
- The lowest final total wins the round.

Valid drops:

- Single card
- Pair
- Trips
- Quads
- Straight of 3 or more consecutive ranks

## Tech Stack

Frontend:

- React 18
- TypeScript
- Tailwind CSS and shadcn/ui components
- Framer Motion
- Wouter routing

Backend:

- Node.js 20
- Express
- `ws` WebSocket server at `/ws`
- Redis-backed storage for production rooms
- Zod validation for room state and socket payloads

Build and deployment:

- Vite frontend build
- esbuild server bundle
- Multi-stage Dockerfile
- Railway-compatible `PORT` handling

## Project Structure

```text
client/src/              React app
server/index.ts          Express entrypoint, middleware, /health
server/routes.ts         API routes and WebSocket handlers
server/storage/          MemStorage, RedisStorage, mutation API
server/metrics.ts        Runtime metrics snapshot
shared/game-engine.ts    Pure game rules and state transitions
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

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

By default, local development uses in-memory storage. To test Redis locally, run a Redis instance and set `REDIS_URL`.

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

Common variables:

```text
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

Redis production variables:

```text
REDIS_URL=redis://...
ROOM_TTL_SECONDS=14400
REDIS_LOCK_TTL_MS=5000
REDIS_LOCK_TIMEOUT_MS=2000
```

If `REDIS_URL` is absent, the server uses local `MemStorage`.

## Health Checks

The app exposes:

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
  "uptime": 1800,
  "memoryMb": 140
}
```

When Redis is unavailable, health returns `status: "degraded"` and includes Redis error context when available.

## Production Deployment

Railway is the primary documented deployment path. Use the root `Dockerfile`; do not configure separate Railway build/start commands unless intentionally moving away from Docker.

Railway app variables:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-app.up.railway.app
ROOM_TTL_SECONDS=14400
REDIS_URL=${{Redis.REDIS_URL}}
```

Keep app replicas at `1`.

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for the complete setup.

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

Default profile: 20 rooms, 5 players per room, 100 connected clients.

```bash
npm run load:ws -- --url=wss://your-app.up.railway.app/ws --rooms=20 --players=5 --durationMs=600000
```

Watch:

- Error count
- Disconnect count
- p95 latency
- `/health` memory and Redis status

## Scaling Notes

Current safe production shape:

```text
1 Node service replica
1 Redis service
in-memory WebSocket connection map
Redis room state
```

Do not run multiple app replicas yet. Room state is shared through Redis, but WebSocket broadcasts are still local to the process. Multi-replica support needs Redis Pub/Sub or a similar distributed fanout layer.

## License

MIT
