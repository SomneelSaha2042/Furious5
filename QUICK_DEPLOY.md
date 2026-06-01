# Quick Deploy Guide

This app is Docker-first for production. Railway with Redis is the recommended path.

## Railway

1. Push the repo to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Let Railway use the root `Dockerfile`.
4. Add a Redis service in the same Railway project.
5. Set these app service variables:

```text
NODE_ENV=production
CORS_ORIGIN=https://your-app.up.railway.app
ROOM_TTL_SECONDS=14400
REDIS_URL=${{Redis.REDIS_URL}}
```

6. Keep app replicas at `1`.
7. Deploy.
8. Check:

```bash
curl https://your-app.up.railway.app/health
```

Expected key fields:

```json
{
  "status": "healthy",
  "redis": "connected"
}
```

Full guide: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

## Docker

Build:

```bash
docker build -t furious5:latest .
```

Run:

```bash
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://yourdomain.com \
  -e REDIS_URL=redis://your-redis-url \
  --name furious5-app \
  furious5:latest
```

Without `REDIS_URL`, the app uses in-memory storage. That is acceptable for quick tests but not for production restart recovery.

## Local Production Smoke Test

```bash
npm ci
npm run build
npm start
```

Then:

```bash
curl http://localhost:5000/health
```

## Load Test

Run the default 100-client profile:

```bash
npm run load:ws -- --url=wss://your-app.up.railway.app/ws --rooms=20 --players=5 --durationMs=600000
```

For a tiny local script smoke test:

```bash
npm run load:ws -- --rooms=0 --durationMs=1
```

## Other Platforms

Any platform can work if it supports:

- Docker builds
- Long-running Node services
- WebSocket upgrades
- A `PORT` environment variable
- Redis reachable through `REDIS_URL`

Recommended settings:

```text
Replicas: 1
Healthcheck: /health
WebSocket path: /ws
```

Avoid multi-replica deploys until distributed WebSocket fanout is implemented.
