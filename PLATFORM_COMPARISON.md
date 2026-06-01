# Platform Comparison

Furious Five is currently optimized for a single Dockerized Node service plus Redis. The most important platform requirements are WebSocket support, stable long-running containers, environment variables, and Redis.

## Quick Comparison

| Platform | Fit | Notes |
| --- | --- | --- |
| Railway | Best current fit | Dockerfile deploy, Redis service, easy variables, good for the one-replica target |
| Render | Good | Works with Docker and Redis, but configure one instance only |
| Fly.io | Good | Strong Docker support; useful later for regional deploys |
| DigitalOcean App Platform | Good | Docker support and managed Redis options |
| VPS + Docker | Good | Maximum control, but you manage Redis, TLS, updates, and monitoring |
| Heroku | Possible | Needs paid dyno and Redis add-on; Docker or Node build path can work |
| Cloud Run | Possible | WebSockets are supported, but request/container lifecycle needs careful testing |
| Kubernetes | Overkill for now | Useful only after distributed fanout and operational maturity |

## Recommendation

Use Railway Hobby for the first production launch:

- One app replica
- One Redis service
- Root `Dockerfile`
- `/health` healthcheck
- `wss://.../ws` WebSocket endpoint

This matches the current architecture and avoids premature multi-service complexity.

## Scaling Guidance

Safe now:

- Increase the resources of the single app service.
- Keep room state in Redis.
- Use the load test to validate 100 connected clients.

Not safe yet:

- Running 2+ app replicas.
- Load balancing WebSocket clients across multiple Node processes.

Reason: room state is in Redis, but socket membership is still stored in a local process map. A broadcast from replica A cannot reach clients connected to replica B until Redis Pub/Sub or another distributed fanout layer is added.

## When To Move Beyond Railway

Consider a more advanced platform only when you need:

- Multiple geographic regions
- Multiple app replicas
- Formal uptime targets
- Centralized logs and metrics
- Account systems, history, or long-term storage

Before that, Railway plus Redis is the cleanest path for this app.
