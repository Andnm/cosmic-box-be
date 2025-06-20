const ConnectionRequest = require('../models/ConnectionRequest');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { createPaymentLink } = require('../services/paymentService');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {
      _id: { $ne: req.user._id },
      roleName: 'user',
      isActive: true
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createConnectionRequest = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.roleName !== 'user' || !receiver.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingRequest = await ConnectionRequest.findOne({
      senderId: req.user._id,
      receiverId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Connection request already exists' });
    }

    const connectionRequest = new ConnectionRequest({
      senderId: req.user._id,
      receiverId,
      message,
      feeAmount: 20000
    });

    await connectionRequest.save();

    const paymentLink = await createPaymentLink({
      requestId: connectionRequest._id,
      userId: req.user._id,
      amount: connectionRequest.feeAmount,
      description: `Ket noi`
    });

    res.status(201).json({
      message: 'Connection request created. Please complete payment.',
      connectionRequest,
      paymentLink
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyConnectionRequests = async (req, res) => {
  try {
    const { type = 'sent', page = 1, limit = 10 } = req.query;
    let query = {};

    if (type === 'sent') {
      query.senderId = req.user._id;
    } else if (type === 'received') {
      query.receiverId = req.user._id;
    }

    const requests = await ConnectionRequest.find(query)
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ConnectionRequest.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const respondToConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      receiverId: req.user._id,
      status: 'pending',
      isPaid: true
    }).populate('senderId');

    if (!connectionRequest) {
      return res.status(404).json({ error: 'Connection request not found or not paid' });
    }

    connectionRequest.status = status;
    await connectionRequest.save();

    if (status === 'accepted') {
      const Conversation = require('../models/Conversation');
      const conversation = new Conversation({
        requestId: connectionRequest._id,
        participants: [
          { userId: connectionRequest.senderId },
          { userId: connectionRequest.receiverId }
        ],
        chatboxName: `Chat between ${connectionRequest.senderId.username} and ${req.user.username}`
      });
      await conversation.save();

      await createNotification({
        userId: connectionRequest.senderId,
        type: 'request_accepted',
        title: 'Connection Request Accepted!',
        content: `${req.user.username} accepted your connection request`,
        relatedId: connectionRequest._id,
        relatedType: 'connection_request'
      });
    } else {
      await createNotification({
        userId: connectionRequest.senderId,
        type: 'request_rejected',
        title: 'Connection Request Rejected',
        content: `${req.user.username} rejected your connection request`,
        relatedId: connectionRequest._id,
        relatedType: 'connection_request'
      });
    }

    res.json({
      message: `Connection request ${status} successfully`,
      connectionRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  createConnectionRequest,
  getMyConnectionRequests,
  respondToConnectionRequest
};