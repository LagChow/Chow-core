import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RealtimeEvents, SocketPayload } from '@lagchow/realtime';
import { jwtVerify } from 'jose';
import cookie from 'cookie';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'YF8LEghqw1aJBbwHJaMMdXRgu9AJ4lFe27d742JEiTY'
);

const app = express();
const server = http.createServer(app);

// Allow CORS from our frontends (Admin, Vendor, Customer)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true), // Dynamic origin for credentials
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// The internal webhook/endpoint that our Next.js API routes will call
app.post('/emit', (req, res) => {
  const { event, data } = req.body as { event: keyof typeof RealtimeEvents, data: SocketPayload };
  if (!event) {
    return res.status(400).json({ error: 'Missing event name' });
  }

  // Broadcast the event to all connected clients
  io.emit(event, data);
  console.log(`[HTTP -> WS] Emitted event '${event}' with payload:`, data);
  
  res.json({ success: true, event });
});

// Handle WebSocket connections directly (from the frontends)
io.use(async (socket, next) => {
  let token = socket.handshake.auth?.token;
  
  // If token is not provided in auth, try to extract from cookies
  if (!token && socket.request.headers.cookie) {
    const cookies = cookie.parse(socket.request.headers.cookie);
    token = cookies.__session;
  }

  if (!token) {
    console.log(`[WS] Connection rejected: Missing token for ${socket.id}`);
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    (socket as any).user = payload; // Attach user to socket
    next();
  } catch (error) {
    console.log(`[WS] Connection rejected: Invalid token for ${socket.id}`);
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id} (User: ${(socket as any).user?.email})`);

  // We can add rooms here later if needed (e.g., joining a specific vendor's room)
  socket.on('join_room', (room: string) => {
    socket.join(room);
    console.log(`[WS] ${socket.id} joined room: ${room}`);
  });
  
  socket.on('leave_room', (room: string) => {
    socket.leave(room);
    console.log(`[WS] ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3010;

server.listen(PORT, () => {
  console.log(`🚀 Realtime WebSocket server running on port ${PORT}`);
});
