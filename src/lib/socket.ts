import { io, Socket } from 'socket.io-client';

// For local development, use localhost:5000. 
// In production, this should be an environment variable.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
