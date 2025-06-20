const Payment = require("../models/Payment");
const ConnectionRequest = require("../models/ConnectionRequest");
const { verifyPayOSWebhook } = require("../services/paymentService");
const { createNotification } = require("../services/notificationService");

const getPaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const payment = await Payment.findOne({
      requestId,
      userId: req.user._id,
    }).populate("requestId");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handlePayOSWebhook = async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    const webhookData = req.body;

    // Nếu là request test từ PayOS (không có data thực tế)
    if (!webhookData || !webhookData.data) {
      console.log("Test webhook from PayOS");
      return res.status(200).json({ message: "Webhook endpoint is working" });
    }

    // Verify signature chỉ khi có data thực tế
    if (!verifyPayOSWebhook(webhookData)) {
      console.log("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const { orderCode, status } = webhookData.data;
    console.log(`Processing payment: ${orderCode}, status: ${status}`);

    const payment = await Payment.findOne({ payosOrderId: orderCode });
    if (!payment) {
      console.log("Payment not found for orderCode:", orderCode);
      return res.status(404).json({ error: "Payment not found" });
    }

    if (status === "PAID") {
      payment.status = "completed";
      payment.paidAt = new Date();
      payment.payosData = webhookData.data;
      await payment.save();

      const connectionRequest = await ConnectionRequest.findById(
        payment.requestId
      ).populate("receiverId", "username");

      if (connectionRequest) {
        connectionRequest.isPaid = true;
        await connectionRequest.save();
        console.log(
          "Connection request marked as paid:",
          connectionRequest._id
        );

        await createNotification({
          userId: connectionRequest.receiverId._id,
          type: "connection_request",
          title: "New Connection Request",
          content: `You have received a connection request`,
          relatedId: connectionRequest._id,
          relatedType: "connection_request",
        });
      }
    } else if (status === "CANCELLED") {
      payment.status = "failed";
      await payment.save();
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate("requestId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPaymentStatus,
  handlePayOSWebhook,
  getMyPayments,
};
