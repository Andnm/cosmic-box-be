const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);

    socket.join(socket.userId);

    socket.on('joinConversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': socket.userId
        });

        if (conversation) {
          socket.join(conversationId);
          console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Join conversation error:', error);
      }
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.user.username} left conversation ${conversationId}`);
    });

    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: data.isTyping
      });
    });

    socket.on('markMessageRead', async (data) => {
      try {
        const { conversationId, messageId } = data;
        
        socket.to(conversationId).emit('messageRead', {
          messageId,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Mark message read error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });
};

module.exports = {
  socketAuth,
  handleConnection
};