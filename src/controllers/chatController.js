const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('../services/notificationService');

const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.userId': req.user._id,
      isActive: true
    })
      .populate('participants.userId', 'username email')
      .populate('requestId')
      .sort({ updatedAt: -1 });

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          conversationId: conv._id
        }).sort({ createdAt: -1 });

        return {
          ...conv.toObject(),
          lastMessage
        };
      })
    );

    res.json({ conversations: conversationsWithLastMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        isRead: false
      },
      { isRead: true }
    );

    const total = await Message.countDocuments({ conversationId });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': req.user._id,
      isActive: true
    }).populate('participants.userId');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = new Message({
      conversationId,
      senderId: req.user._id,
      content
    });

    await message.save();
    await message.populate('senderId', 'username');

    conversation.updatedAt = new Date();
    await conversation.save();

    const otherParticipants = conversation.participants.filter(
      p => p.userId._id.toString() !== req.user._id.toString()
    );

    for (const participant of otherParticipants) {
      await createNotification({
        userId: participant.userId._id,
        type: 'new_message',
        title: 'New Message',
        content: `${req.user.username} sent you a message`,
        relatedId: conversationId,
        relatedType: 'conversation'
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('newMessage', message);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead
};