import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { User } from '../models/User.js';
import { isAdminRole } from '../config/adminPermissions.js';

let io = null;

/**
 * Initialize Socket.IO Server with JWT Authentication and Role/User Room Isolation
 * @param {import('http').Server} httpServer
 */
export const initializeSocket = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication Middleware for WebSocket Connections
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token && socket.handshake.headers?.cookie) {
        // Fallback: parse accessToken from cookie if present
        const match = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      const user = await User.findById(decoded.id).select('name email role accountStatus');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
        return next(new Error('Authentication error: Account suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('[Socket.IO] Handshake auth error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRole = socket.user.role;

    // 1. Join user-isolated private room: user:{userId}
    socket.join(`user:${userId}`);

    // 2. If administrative staff, join privileged admin room: admin:room
    if (isAdminRole(userRole)) {
      socket.join('admin:room');
    }

    // Support chat typing event
    socket.on('support:typing', ({ ticketId, isTyping }) => {
      if (ticketId) {
        socket.to(`support:ticket:${ticketId}`).emit('support:typing', {
          ticketId,
          userId,
          name: socket.user.name,
          isTyping,
        });
      }
    });

    // Support ticket room join
    socket.on('support:join', ({ ticketId }) => {
      if (ticketId) {
        socket.join(`support:ticket:${ticketId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      // Clean disconnect
    });
  });

  return io;
};

/**
 * Access the active Socket.IO server instance
 * @returns {import('socket.io').Server|null}
 */
export const getIO = () => io;

/**
 * Emit event to a specific user's private channel
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} event
 * @param {any} payload
 */
export const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
};

/**
 * Emit event to all connected administrators
 * @param {string} event
 * @param {any} payload
 */
export const emitToAdmin = (event, payload) => {
  if (io) {
    io.to('admin:room').emit(event, payload);
  }
};

/**
 * Broadcast event platform-wide to all connected clients
 * @param {string} event
 * @param {any} payload
 */
export const broadcastGlobal = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAdmin,
  broadcastGlobal,
};
