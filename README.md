# Furious Five 🃏

A real-time multiplayer card game built with TypeScript, React, and Socket.IO. Race to get your hand total under five points, call at the perfect moment, and enjoy a newly refreshed felt-table experience tuned for phones, tablets, and desktops.

[![CI](https://github.com/SomneelSaha2004/Furious5/workflows/CI/badge.svg)](https://github.com/SomneelSaha2004/Furious5/actions)
[![Docker](https://github.com/SomneelSaha2004/Furious5/workflows/Docker%20Build%20and%20Push/badge.svg)](https://github.com/SomneelSaha2004/Furious5/actions)

## 🎮 Game Overview

Furious Five is a fast-paced card game for 2-5 players where strategy meets quick thinking. Players compete to achieve the lowest hand total while managing risk and timing their calls perfectly.

### How to Play

**Objective:** Get your hand total to 5 points or less, then call the game to win.

**Setup:**
- Each player starts with 5 cards
- Cards are worth their face value (Ace = 1, Face cards = 11-13)
- Players take turns in sequence

**Turn Actions:**
1. **Drop** a valid combination (or a single card) to clear points from your hand
2. **Draw** from the deck or available table drops to refill after playing a combo
3. **Call** once your hand total is ≤ 5 to trigger the final showdown

**Valid Drops:**
   - **Single:** Any individual card
   - **Pair:** Two cards of the same rank
   - **Trips:** Three cards of the same rank  
   - **Quads:** Four cards of the same rank
   - **Straight:** 3+ consecutive cards (A-2-3, 2-3-4, etc.)

**Calling the Game:**
- When your hand total is ≤ 5 points, you can call the game
- All other players get one final turn
- Lowest total wins and takes the pot
- Tied lowest scores split the winnings

**Special Features:**
- 30-second animated turn timer with auto-drop safety net
- Mobile-first table shell with swipe-friendly hand slider
- Framer Motion micro-interactions and tactile feedback
- Light/dark theme support with cohesive casino-inspired tokens
- Automatic game state management and reconnection handling

## ✨ What’s New in the Latest Polish Pass

- **Unified design tokens:** refreshed color system, typography ramp, and felt/chip utilities (`client/src/index.css` + `theme-provider`).
- **Responsive table shell:** grid-based layout that adapts to tablet/phone, with clear turn markers and Lucide icons.
- **Swipe-friendly player hand:** gesture-ready slider with large touch targets and combo detection.
- **Modern lobby & shells:** mobile headers, stacked panels, and accordion-powered debug tooling.
- **Motion cues everywhere:** countdown ring, card drops, and lobby transitions powered by Framer Motion.

Screenshots and short clips live in `attached_assets/` to guide future styling tweaks.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SomneelSaha2042/Furious5
   cd furious-five
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5000`
   - Create a room and share the room code with friends
   - Start playing!

## 🏗️ Technical Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** + **shadcn/ui** for modern, accessible UI components
- **Custom design tokens** for brand colors, felt surfaces, and chip accents
- **Framer Motion** for micro-interactions and animated system feedback
- **Wouter** for lightweight client-side routing
- **Socket.IO Client** for real-time game communication

### Backend
- **Express.js** server with TypeScript
- **Socket.IO** for WebSocket-based multiplayer functionality
- **In-memory storage** for fast, ephemeral game sessions
- **Zod** for runtime validation and type safety

### Game Engine
- Pure functional game logic separated from server concerns
- Deterministic state transitions for reliable multiplayer experience
- Room-based sessions supporting 2-5 concurrent players
- Automatic cleanup of inactive games
- Shared schema + Zod validation to keep client/server aligned

### Design System

- Theme tokens are defined in `client/src/index.css` and hydrated via `client/src/components/theme-provider.tsx`.
- Felt/table utilities (`felt-surface`, `chip-stack`, `glass-panel`) create casino-inspired surfaces out of the box.
- Typography ramps use `Inter` + `Poppins` with heading/body weights mapped to CSS variables.
- Adjusting brand colors or motion curves in the token set immediately ripples through every surface.

## 📁 Project Structure

```
furious-five/
├── client/src/           # React frontend application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route components
│   └── hooks/           # Custom React hooks
├── server/              # Express.js backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   └── storage.ts       # In-memory data management
├── shared/              # Common code between client/server
│   ├── game-engine.ts   # Core game logic
│   ├── game-types.ts    # TypeScript type definitions
│   └── schema.ts        # Data validation schemas
└── README.md           # This file
```

## 🎯 Key Features

- **Real-time Multiplayer:** Instant state sync with optimistic UI cues
- **Smart Timer System:** Animated 30-second countdown with auto-drop fallback
- **Flexible Card Combos:** Singles, multiples, straights, and table draws
- **Polished Tabletop Feel:** Felt textures, chip stacks, and iconography
- **Responsive & Accessible:** Touch-optimized controls, keyboard support, high-contrast themes
- **Automatic Reconnection:** Recovers socket sessions and falls back to HTTP snapshots

## 📱 Manual QA Checklist

Run through these touchpoints after UI tweaks:

1. **Phone (≤ 430px):** confirm hand slider swipes, table drop actions, and lobby stacking.
2. **Tablet (768-1024px):** ensure side rails align, timers float correctly, and overlays scale.
3. **Desktop (≥ 1280px):** verify felt surface layout, turn indicators, and motion timing.
4. **Theme flip:** toggle light/dark to check chip, felt, and typography contrast.
5. **Latency simulation:** drop combos and watch timer animations for jitter.

## 🎲 Game Strategy Tips

1. **Early Game:** Focus on collecting pairs and trips for efficient hand reduction
2. **Mid Game:** Watch other players' discards to anticipate their strategies
3. **End Game:** Time your call carefully - too early and others might beat your score
4. **Risk Management:** Sometimes it's better to drop high cards even if you can't make combinations
5. **Observation:** Pay attention to what cards others pick from the graveyard

## 🛠️ Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production bundles for client and server
- `npm run start` - Run the production server
- `npm run check` - Run TypeScript type checking
- `npm run deploy` - Run the automated deployment script
- `npm run pm2:start` - Start with PM2 process manager
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/SomneelSaha2004/Furious5.git
cd Furious5
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🚀 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Start

**Option 1: Traditional Deployment**
```bash
npm ci --only=production
npm run build
npm start
```

**Option 2: Docker**
```bash
docker build -t furious5:latest .
docker run -d -p 5000:5000 --env-file .env furious5:latest
```

**Option 3: Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Option 4: Automated Script**
```bash
./deploy.sh
```

### Deployment Features

✅ **Security:**
- Helmet.js for security headers
- CORS configuration
- Rate limiting on API and WebSocket endpoints
- Input validation and sanitization

✅ **Performance:**
- Response compression (gzip)
- Static file caching
- Efficient WebSocket connection handling
- Horizontal scaling ready

✅ **Reliability:**
- Health check endpoint at `/health`
- Graceful shutdown handling
- Process management with PM2
- Docker containerization support

✅ **Monitoring:**
- Structured logging
- Request/response tracking
- Error handling and reporting
- Health status monitoring

### Platform-Specific Deployment

**Heroku:**
```bash
heroku create your-app-name
git push heroku main
```

**Railway / Render / DigitalOcean:**
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: Auto-detected from `PORT` env variable

**Kubernetes:**
```bash
kubectl apply -f k8s-deployment.yml
```

### Environment Variables

Required:
- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Server port (default: 5000)

Optional:
- `CORS_ORIGIN` - Allowed origins for CORS (default: `*`)

## 📊 Health Monitoring

Check application health:
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

## 🛳️ Deployment

The Express server listens on the port defined by the `PORT` environment variable (defaults to `5000`) and serves the static React build alongside the WebSocket endpoint at `/ws`.

### Scaling Considerations

The application uses in-memory storage by default. For production scaling:
- Consider using Redis for shared session/game state
- Implement sticky sessions for WebSocket connections
- Use a load balancer with WebSocket support
- Set up database for persistent storage

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed scaling strategies.

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Ready to play?** Start a game and see if you can master the art of Furious Five! 🃏✨
