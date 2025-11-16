require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const { verifySocketToken } = require('./middleware/socketAuth');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET','POST']
  }
});

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);


const activeUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  try {
    await verifySocketToken(socket);
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', socket => {
  const userId = socket.userId;
  activeUsers.set(userId, socket.id);

  socket.on('join', async () => {
    // can be used to join rooms
  });

  socket.on('private_message', async ({ toUserId, text }) => {
    if (!toUserId || !text) return;
    // persist
    const msg = await Message.create({
      from: userId,
      to: toUserId,
      text
    });
    // emit to receiver if online
    const toSocketId = activeUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('private_message', {
        _id: msg._id,
        from: userId,
        to: toUserId,
        text,
        createdAt: msg.createdAt
      });
    }
    // also send ack to sender
    socket.emit('message_sent', {
      _id: msg._id,
      from: userId,
      to: toUserId,
      text,
      createdAt: msg.createdAt
    });
  });

  socket.on('typing', ({ toUserId, isTyping }) => {
    const toSocketId = activeUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('typing', { from: userId, isTyping });
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(userId);
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, { })
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
