# Production Deployment Guide

This app is designed to deploy as one Node service that serves the React frontend, Express API, and `/ws` WebSocket server.

The preferred production deployment is Docker. Railway Hobby with Redis is the primary supported target.

## Production Architecture

```text
Browser clients
  -> HTTPS / WSS
  -> Node container
     -> Express API and React static frontend
     -> ws WebSocket server at /ws
     -> in-process room connection map
     -> storage.mutateRoom(...) for safe state changes
     -> Redis room persistence when REDIS_URL is set
```

Use one app replica. Multiple replicas are not supported yet because WebSocket room fanout is process-local.

## Environment Variables

Required for production:

```text
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

Common platform/runtime variables:

```text
PORT=5000
```

Redis variables:

```text
REDIS_URL=redis://...
ROOM_TTL_SECONDS=14400
REDIS_LOCK_TTL_MS=5000
REDIS_LOCK_TIMEOUT_MS=2000
```

If `REDIS_URL` is not set, the app uses in-memory storage. That is fine for local development but not recommended for production restarts.

## Docker Deployment

Build the image:

```bash
docker build -t furious5:latest .
```

Run with Redis:

```bash
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://yourdomain.com \
  -e REDIS_URL=redis://your-redis-url \
  -e ROOM_TTL_SECONDS=14400 \
  --name furious5-app \
  furious5:latest
```

The Dockerfile runs:

- `npm ci`
- `npm run build`
- `npm prune --omit=dev`
- `node dist/index.js`

The container healthcheck calls `/health` using the runtime `PORT`.

## Railway

Use [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) as the source of truth.

Summary:

1. Deploy from GitHub.
2. Let Railway use the root `Dockerfile`.
3. Add a Redis service in the same Railway project.
4. Set:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-app.up.railway.app
ROOM_TTL_SECONDS=14400
REDIS_URL=${{Redis.REDIS_URL}}
```

5. Keep replicas at `1`.
6. Verify `/health` reports `redis: "connected"`.

## Traditional Node Deployment

Traditional deployment still works when a host provides Node.js 20+:

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Set `REDIS_URL` for production persistence.

## Health Checks

Endpoints:

```text
/health
/api/health
```

Example:

```json
{
  "status": "healthy",
  "timestamp": "2026-06-01T00:00:00.000Z",
  "environment": "production",
  "redis": "connected",
  "activeRooms": 4,
  "activeSockets": 18,
  "messagesReceived": 920,
  "messagesSent": 2400,
  "roomsCreated": 12,
  "uptime": 3600,
  "memoryMb": 160,
  "heapUsedMb": 48
}
```

If Redis cannot be queried, health responds with `status: "degraded"` rather than failing the request.

## Load Testing

Run against a local or deployed WebSocket endpoint:

```bash
npm run load:ws -- --url=wss://your-app.up.railway.app/ws --rooms=20 --players=5 --durationMs=600000
```

Pass criteria for the current Railway Hobby target:

- App does not crash
- Redis remains connected
- Error/disconnect counts stay low
- p95 action-to-state-update latency is roughly under 300-500 ms
- Memory remains stable

## Restart Recovery Test

1. Create a room.
2. Join 3-5 players.
3. Start a game.
4. Restart or redeploy the app.
5. Reconnect with saved `roomCode` and `playerId`.
6. Confirm state is restored from Redis.

## Scaling

Current supported production scaling:

- Scale vertically within one app replica.
- Use Redis for room state persistence.
- Keep WebSocket connection maps in memory.

Not supported yet:

- Multiple app replicas
- Redis Pub/Sub fanout
- Socket.IO adapter fanout
- Persistent accounts/history database

To support multiple replicas later, add distributed room fanout so a broadcast from one process reaches sockets connected to other processes.

## Troubleshooting

Redis disconnected:

- Confirm `REDIS_URL` is set on the app service.
- Confirm the Redis service is in the same Railway project/environment.
- Check `/health` for `lastRedisError`.

Rooms disappear after a while:

- This is expected for abandoned rooms.
- Default `ROOM_TTL_SECONDS` is 14400 seconds, or 4 hours.

WebSocket connections fail:

- Confirm the platform supports WebSocket upgrades.
- Confirm the public URL uses `wss://` in production.
- Confirm `/ws` is not blocked by proxy rules.

CORS errors:

- Set `CORS_ORIGIN` to the exact HTTPS origin.
- Use `*` only for local development or temporary testing.
