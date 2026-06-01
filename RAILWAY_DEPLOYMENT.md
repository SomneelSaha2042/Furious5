# Railway Hobby Deployment

Furious5 should deploy as one Node web service plus one Redis service. Do not enable multiple app replicas until room fanout is moved to Redis Pub/Sub or a Socket.IO Redis adapter style setup. The current WebSocket connection map is intentionally in process.

## Project Setup

1. Create a Railway project from the GitHub repo.
2. Configure the app service:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Replicas: `1`
3. Add a Redis database service in the same Railway project.
4. Keep Redis private to the project unless temporary debugging requires otherwise.

## Environment Variables

Set these on the Node app service:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-app.up.railway.app
ROOM_TTL_SECONDS=14400
REDIS_URL=${{Redis.REDIS_URL}}
```

After adding a custom domain, replace `CORS_ORIGIN` with the custom HTTPS origin. Do not leave `CORS_ORIGIN=*` for production.

## Smoke Checks

After deployment, verify the app and Redis state backend:

```bash
curl https://your-app.up.railway.app/health
```

Expected fields include:

```json
{
  "status": "healthy",
  "redis": "connected",
  "activeRooms": 0,
  "activeSockets": 0
}
```

Then confirm the WebSocket endpoint is reachable:

```text
wss://your-app.up.railway.app/ws
```

## Load Test

Run the default 100-client profile:

```bash
WS_URL=wss://your-app.up.railway.app/ws npm run load:ws
```

Useful overrides:

```bash
npm run load:ws -- --url=wss://your-app.up.railway.app/ws --rooms=20 --players=5 --durationMs=1200000
```

Pass criteria:

- The app does not crash.
- `/health` continues to report Redis as connected.
- Error and disconnect counts stay low.
- p95 action-to-state-update latency is roughly under 300-500 ms.
- Memory remains within Railway Hobby practical limits.

## Restart Recovery Checklist

1. Create a room.
2. Join 3-5 players.
3. Ready all players and start the game.
4. Redeploy or restart the app service.
5. Reconnect with the saved `roomCode` and `playerId`.
6. Confirm `game:getState` returns the room from Redis and marks the player connected.

If this passes, the app is ready for a single-replica Railway Hobby production launch.
