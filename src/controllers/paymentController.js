const Payment = require('../models/Payment');
const ConnectionRequest = require('../models/ConnectionRequest');
const { verifyPayOSWebhook } = require('../services/paymentService');
const { createNotification } = require('../services/notificationService');

const getPaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const payment = await Payment.findOne({
      requestId,
      userId: req.user._id
    }).populate('requestId');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handlePayOSWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    if (!verifyPayOSWebhook(webhookData)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { orderCode, status } = webhookData.data;

    const payment = await Payment.findOne({ payosOrderId: orderCode });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'PAID') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.payosData = webhookData.data;
      await payment.save();

      const connectionRequest = await ConnectionRequest.findById(payment.requestId)
        .populate('receiverId', 'username');
      
      if (connectionRequest) {
        connectionRequest.isPaid = true;
        await connectionRequest.save();

        await createNotification({
          userId: connectionRequest.receiverId._id,
          type: 'connection_request',
          title: 'New Connection Request',
          content: `You have received a connection request`,
          relatedId: connectionRequest._id,
          relatedType: 'connection_request'
        });
      }
    } else if (status === 'CANCELLED') {
      payment.status = 'failed';
      await payment.save();
    }

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('requestId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPaymentStatus,
  handlePayOSWebhook,
  getMyPayments
};