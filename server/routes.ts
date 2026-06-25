import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { metrics } from "./metrics";
import { storage } from "./storage";
import type { Card, GameState } from "@shared/game-types";
import {
  JoinRoomSchema,
  CreateRoomSchema,
  DropCardsSchema,
  DrawFromTableSchema,
  type DropCardsData,
} from "@shared/game-types";
import {
  createGame,
  startRound,
  applyDrop,
  drawFromDeck,
  drawFromTable,
  settleOnCall,
  checkInvariants,
  togglePlayerReady,
} from "@shared/game-engine";
import { joinOrReconnectPlayer } from "./room-join";

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomCode?: string;
  playerName?: string;
  lastPing?: number;
  disconnectTimer?: NodeJS.Timeout;
}

interface SocketMessage {
  type: string;
  data: any;
}

function formatCard(card: Card): string {
  const rank = card.r === 1 ? "A" : card.r === 11 ? "J" : card.r === 12 ? "Q" : card.r === 13 ? "K" : card.r.toString();
  const suit = card.s === "H" ? "H" : card.s === "D" ? "D" : card.s === "C" ? "C" : "S";
  return `${rank}${suit}`;
}

function errorCodeForJoin(error: Error): string {
  if (error.message === "Room not found") return "ROOM_NOT_FOUND";
  if (error.message === "Game already in progress") return "GAME_IN_PROGRESS";
  if (error.message === "A player with that name is already in the room") return "PLAYER_ALREADY_EXISTS";
  return "JOIN_FAILED";
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const roomConnections = new Map<string, Set<ExtendedWebSocket>>();

  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname !== "/ws") {
      return;
    }

    wss.handleUpgrade(request, socket, head, (webSocket) => {
      wss.emit("connection", webSocket, request);
    });
  });

  function generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `FF-${result}`;
  }

  function updateActiveSocketMetric(): void {
    metrics.setActiveSockets(wss.clients.size);
  }

  function broadcastToRoom(roomCode: string, message: any, excludeSocket?: ExtendedWebSocket): void {
    const connections = roomConnections.get(roomCode);
    if (!connections) return;

    const messageStr = JSON.stringify(message);
    for (const socket of Array.from(connections)) {
      if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
        metrics.incrementMessagesSent();
      }
    }
  }

  function sendToSocket(socket: ExtendedWebSocket, message: any): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      metrics.incrementMessagesSent();
    }
  }

  function sendError(socket: ExtendedWebSocket, code: string, message: string): void {
    sendToSocket(socket, {
      type: "error",
      data: { code, message },
    });
  }

  function addSocketToRoom(socket: ExtendedWebSocket, roomCode: string): void {
    if (!roomConnections.has(roomCode)) {
      roomConnections.set(roomCode, new Set());
    }
    roomConnections.get(roomCode)!.add(socket);
  }

  async function updatePlayerConnection(
    roomCode: string,
    playerId: string,
    connected: boolean,
  ): Promise<GameState | undefined> {
    try {
      const updatedState = await storage.mutateRoom(roomCode, async (gameState) => {
        const playerIndex = gameState.players.findIndex((player) => player.id === playerId);
        if (playerIndex === -1) {
          return gameState;
        }

        const currentPlayer = gameState.players[playerIndex];
        if (currentPlayer.connected === connected) {
          return gameState;
        }

        const updatedPlayers = [...gameState.players];
        updatedPlayers[playerIndex] = {
          ...currentPlayer,
          connected,
        };

        return {
          ...gameState,
          players: updatedPlayers,
          version: gameState.version + 1,
        };
      });

      broadcastToRoom(roomCode, {
        type: "state:update",
        data: updatedState,
      });

      return updatedState;
    } catch (error) {
      if ((error as Error).message !== "Room not found") {
        console.error("Error updating player connection:", error);
      }
      return undefined;
    }
  }

  function scheduleDisconnect(socket: ExtendedWebSocket): void {
    if (socket.disconnectTimer) {
      clearTimeout(socket.disconnectTimer);
    }

    socket.disconnectTimer = setTimeout(async () => {
      if (socket.roomCode && socket.playerId) {
        console.log(`Player ${socket.playerId} marked as disconnected after grace period`);
        await updatePlayerConnection(socket.roomCode, socket.playerId, false);
      }
    }, 120000);
  }

  function cancelDisconnect(socket: ExtendedWebSocket): void {
    if (socket.disconnectTimer) {
      clearTimeout(socket.disconnectTimer);
      socket.disconnectTimer = undefined;
    }
  }

  wss.on("connection", (socket: ExtendedWebSocket, request) => {
    console.log("New WebSocket connection", {
      url: request.url,
      protocol: request.headers["sec-websocket-protocol"],
      userAgent: request.headers["user-agent"],
    });
    updateActiveSocketMetric();

    socket.lastPing = Date.now();

    socket.on("pong", () => {
      socket.lastPing = Date.now();
      cancelDisconnect(socket);
    });

    socket.on("message", async (data) => {
      try {
        const message: SocketMessage = JSON.parse(data.toString());
        metrics.incrementMessagesReceived();

        socket.lastPing = Date.now();
        cancelDisconnect(socket);

        switch (message.type) {
          case "ping": {
            sendToSocket(socket, { type: "pong", data: {} });
            break;
          }

          case "room:create": {
            const parsed = CreateRoomSchema.parse(message.data);
            const roomCode = generateRoomCode();
            const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log(`Creating room ${roomCode} for player ${parsed.playerName} (${playerId})`);

            const gameState = createGame(roomCode, parsed.playerName, playerId);
            await storage.createRoom(gameState);
            metrics.incrementRoomsCreated();

            socket.playerId = playerId;
            socket.roomCode = roomCode;
            socket.playerName = parsed.playerName;
            addSocketToRoom(socket, roomCode);

            sendToSocket(socket, {
              type: "room:created",
              data: { roomCode, playerId },
            });

            sendToSocket(socket, {
              type: "state:update",
              data: gameState,
            });

            break;
          }

          case "room:join": {
            const parsed = JoinRoomSchema.parse(message.data);
            const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            try {
              let playerId = newPlayerId;
              const updatedState = await storage.mutateRoom(parsed.roomCode, async (gameState) => {
                const result = joinOrReconnectPlayer(gameState, parsed.playerName, newPlayerId);
                playerId = result.playerId;
                return result.state;
              });

              socket.playerId = playerId;
              socket.roomCode = parsed.roomCode;
              socket.playerName = parsed.playerName;
              addSocketToRoom(socket, parsed.roomCode);

              sendToSocket(socket, {
                type: "room:joined",
                data: { roomCode: parsed.roomCode, playerId },
              });

              broadcastToRoom(parsed.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              const err = error as Error;
              sendError(socket, errorCodeForJoin(err), err.message);
            }

            break;
          }

          case "player:ready": {
            if (!socket.roomCode || !socket.playerId) {
              sendError(socket, "NOT_IN_GAME", "Not in a game");
              break;
            }

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const next = togglePlayerReady(gameState, socket.playerId!);
                checkInvariants(next);
                return next;
              });

              const player = updatedState.players.find((p) => p.id === socket.playerId);
              broadcastToRoom(socket.roomCode, {
                type: "notification",
                data: {
                  message: `${player?.name || "Player"} is ${player?.ready ? "ready" : "not ready"}`,
                  type: "info",
                },
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "READY_FAILED", (error as Error).message);
            }

            break;
          }

          case "game:start": {
            if (!socket.roomCode) {
              sendError(socket, "NOT_IN_ROOM", "Not in a room");
              break;
            }

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const next = startRound(gameState);
                checkInvariants(next);
                return next;
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "START_FAILED", (error as Error).message);
            }

            break;
          }

          case "turn:call": {
            if (!socket.roomCode || !socket.playerId) {
              sendError(socket, "NOT_IN_GAME", "Not in a game");
              break;
            }

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const next = settleOnCall(gameState, socket.playerId!);
                checkInvariants(next);
                return next;
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "CALL_FAILED", (error as Error).message);
            }

            break;
          }

          case "turn:drop": {
            if (!socket.roomCode || !socket.playerId) {
              sendError(socket, "NOT_IN_GAME", "Not in a game");
              break;
            }

            const parsed: DropCardsData = DropCardsSchema.parse(message.data);

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const next = applyDrop(gameState, socket.playerId!, parsed.drop as any);
                checkInvariants(next);
                return next;
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "DROP_FAILED", (error as Error).message);
            }

            break;
          }

          case "turn:drawDeck": {
            if (!socket.roomCode || !socket.playerId) {
              sendError(socket, "NOT_IN_GAME", "Not in a game");
              break;
            }

            let playerName = "Player";

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const player = gameState.players.find((p) => p.id === socket.playerId);
                playerName = player?.name || "Player";
                const next = drawFromDeck(gameState, socket.playerId!);
                checkInvariants(next);
                return next;
              });

              broadcastToRoom(socket.roomCode, {
                type: "notification",
                data: {
                  message: `${playerName} drew from deck`,
                  type: "info",
                },
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "DRAW_FAILED", (error as Error).message);
            }

            break;
          }

          case "turn:drawFromTable": {
            if (!socket.roomCode || !socket.playerId) {
              sendError(socket, "NOT_IN_GAME", "Not in a game");
              break;
            }

            const parsed = DrawFromTableSchema.parse(message.data);
            let notification: string | undefined;

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const player = gameState.players.find((p) => p.id === socket.playerId);
                const cardTaken = gameState.tableDrop?.cards[parsed.cardIndex];
                if (cardTaken) {
                  notification = `${player?.name || "Player"} drew ${formatCard(cardTaken)} from pile`;
                }

                const next = drawFromTable(gameState, socket.playerId!, parsed.cardIndex);
                checkInvariants(next);
                return next;
              });

              if (notification) {
                broadcastToRoom(socket.roomCode, {
                  type: "notification",
                  data: {
                    message: notification,
                    type: "info",
                  },
                });
              }

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "DRAW_FAILED", (error as Error).message);
            }

            break;
          }

          case "round:new": {
            if (!socket.roomCode) {
              sendError(socket, "NOT_IN_ROOM", "Not in a room");
              break;
            }

            try {
              const updatedState = await storage.mutateRoom(socket.roomCode, async (gameState) => {
                const next = startRound({
                  ...gameState,
                  phase: "playing",
                  settlement: null,
                  roundNumber: gameState.roundNumber + 1,
                });
                checkInvariants(next);
                return next;
              });

              broadcastToRoom(socket.roomCode, {
                type: "state:update",
                data: updatedState,
              });
            } catch (error) {
              sendError(socket, "NEW_ROUND_FAILED", (error as Error).message);
            }

            break;
          }

          case "game:getState": {
            const roomCode = message.data?.roomCode || socket.roomCode;
            const playerId = message.data?.playerId || socket.playerId;

            if (!roomCode) {
              sendError(socket, "NOT_IN_ROOM", "Not in a room");
              break;
            }

            let gameState = await storage.getRoom(roomCode);
            if (!gameState) {
              sendError(socket, "ROOM_NOT_FOUND", "Room not found");
              break;
            }

            if (playerId && !socket.playerId) {
              const player = gameState.players.find((p) => p.id === playerId);
              if (player) {
                socket.playerId = playerId;
                socket.roomCode = roomCode;
                socket.playerName = player.name;
                const updatedState = await updatePlayerConnection(roomCode, playerId, true);
                gameState = updatedState ?? gameState;
              }
            }

            if (socket.roomCode) {
              addSocketToRoom(socket, socket.roomCode);
            }

            sendToSocket(socket, {
              type: "state:update",
              data: gameState,
            });

            break;
          }

          default:
            sendError(socket, "UNKNOWN_MESSAGE", `Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        sendError(socket, "PARSE_ERROR", "Invalid message format");
      }
    });

    socket.on("close", async (code, reason) => {
      console.log("WebSocket connection closed", {
        code,
        reason: reason.toString(),
        roomCode: socket.roomCode,
        playerId: socket.playerId,
      });
      updateActiveSocketMetric();

      if (socket.roomCode && socket.playerId) {
        const connections = roomConnections.get(socket.roomCode);
        if (connections) {
          connections.delete(socket);
        }

        scheduleDisconnect(socket);
      }
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  setInterval(() => {
    updateActiveSocketMetric();

    roomConnections.forEach((connections) => {
      connections.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();

          const timeSinceLastPing = Date.now() - (socket.lastPing || 0);
          if (timeSinceLastPing > 30000) {
            console.log(`No response from ${socket.playerId} in ${timeSinceLastPing}ms, scheduling disconnect`);
            scheduleDisconnect(socket);
          }
        }
      });
    });
  }, 10000);

  app.post("/api/rooms", async (req, res) => {
    try {
      const parsed = CreateRoomSchema.parse(req.body);
      const roomCode = generateRoomCode();
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const gameState = createGame(roomCode, parsed.playerName, playerId);
      await storage.createRoom(gameState);
      metrics.incrementRoomsCreated();

      res.json({
        success: true,
        roomCode,
        playerId,
        gameState,
      });
    } catch (error) {
      console.error("HTTP: Error creating room:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/rooms/:roomCode/join", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const parsed = JoinRoomSchema.parse(req.body);
      const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let playerId = newPlayerId;
      const updatedState = await storage.mutateRoom(roomCode, async (gameState) => {
        const result = joinOrReconnectPlayer(gameState, parsed.playerName, newPlayerId);
        playerId = result.playerId;
        return result.state;
      });

      broadcastToRoom(roomCode, {
        type: "state:update",
        data: updatedState,
      });

      res.json({
        success: true,
        playerId,
        gameState: updatedState,
      });
    } catch (error) {
      const err = error as Error;
      const code = errorCodeForJoin(err);
      const status = code === "ROOM_NOT_FOUND" ? 404 : 400;

      console.error("HTTP: Error joining room:", error);
      res.status(status).json({
        success: false,
        error: err.message,
      });
    }
  });

  app.get("/api/rooms/:roomCode", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const gameState = await storage.getRoom(roomCode);

      if (!gameState) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      res.json({
        success: true,
        gameState,
      });
    } catch (error) {
      console.error("HTTP: Error getting room:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/health", async (_req, res) => {
    let activeRooms: string[] = [];
    let status = "healthy";

    try {
      activeRooms = await storage.listActiveRooms();
    } catch (error) {
      status = "degraded";
      console.error("API health storage error:", error);
    }

    const snapshot = await metrics.snapshot(activeRooms.length);

    res.json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      ...snapshot,
    });
  });

  return httpServer;
}
