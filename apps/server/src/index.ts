import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { jwtVerify } from "jose";
import {
  findNextAvailableOrderForDispatch,
  startOrderDispatchEngine,
} from "./dispatch";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const PORT = process.env.PORT || 3010;

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET environment variable is required in production.");
    }
    return new TextEncoder().encode("lagchow-dev-only-jwt-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

// Configure Socket.io with CORS allowing our web apps
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust in production to match specific web domains
    methods: ["GET", "POST"]
  }
});

// Optional Authentication Middleware for Socket Connections
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());
      socket.data.user = payload;
    } catch (err) {
      console.warn("Invalid JWT on socket connection:", socket.id);
    }
  }
  next();
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Clients can join rooms based on their role/ID to receive targeted events
  socket.on("join_room", (room: string) => {
    socket.join(room);
    console.log(`📌 Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("leave_room", (room: string) => {
    socket.leave(room);
    console.log(`📌 Socket ${socket.id} left room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// REST Endpoint for Next.js Serverless API routes to trigger Socket Broadcasts
app.post("/emit", (req, res) => {
  const expectedSecret = process.env.INTERNAL_WS_SECRET;
  if (expectedSecret) {
    const providedSecret = req.headers["x-internal-secret"];
    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized internal emit request" });
    }
  }

  const { event, room, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: "Missing event or data payload" });
  }

  console.log(`📢 Broadcasting Event [${event}] ${room ? `to room [${room}]` : "globally"}`);

  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }

  if (
    event === "ORDER_CREATED" ||
    (event === "ORDER_STATUS_CHANGED" &&
      ["accepted", "preparing", "ready"].includes(data?.data?.status))
  ) {
    void findNextAvailableOrderForDispatch(io);
  }

  return res.status(200).json({ success: true });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "lagchow-realtime-server", timestamp: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 LagChow Realtime & Background Server running on port ${PORT}`);
  startOrderDispatchEngine(io);
});
