const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Store active users and their socket IDsnode index.js    
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a user joins, associate their user ID with their socket ID
  socket.on('join', (userId) => {
    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
      // Also join a room for private messaging
      socket.join(userId);
    }
  });

  // Handle new message event
  socket.on('send_message', (data) => {
    const { receiverId, message } = data;
    console.log(`Message from ${message.sender_id} to ${receiverId}`);
    
    // Emit to the receiver's room
    socket.to(receiverId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    // Remove user from activeUsers map
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('BookLoop Chat Server is running');
});

server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
