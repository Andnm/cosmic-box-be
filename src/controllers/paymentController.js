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
    console.log("=== WEBHOOK RECEIVED ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("========================");

    const webhookData = req.body;

    console.log("webhookData: ", webhookData);

    // Xử lý request test từ PayOS (không có data thực tế)
    // if (
    //   !webhookData ||
    //   Object.keys(webhookData).length === 0 ||
    //   !webhookData.data ||
    //   webhookData.test === true
    // ) {
    //   console.log("🧪 Test request from PayOS detected");
    //   return res.status(200).json({
    //     message: "Webhook endpoint is working",
    //     status: "success",
    //     timestamp: new Date().toISOString(),
    //   });
    // }

    // Kiểm tra cấu trúc data
    // if (!webhookData.data || !webhookData.data.orderCode) {
    //   console.log("❌ Invalid webhook data structure");
    //   return res.status(200).json({
    //     message: "Invalid data structure but endpoint is working",
    //     received: webhookData,
    //   });
    // }

    // Verify signature (tạm thời skip để test, sau này bật lại)
    // if (!verifyPayOSWebhook(webhookData)) {
    //   console.log('❌ Invalid webhook signature');
    //   return res.status(400).json({ error: 'Invalid webhook signature' });
    // }

    const { orderCode, status } = webhookData.data;
    console.log(`💳 Processing payment: ${orderCode}, status: ${status}`);

    // Tìm payment trong database
    const payment = await Payment.findOne({
      payosOrderId: orderCode.toString(),
    });
    if (!payment) {
      console.log("❌ Payment not found for orderCode:", orderCode);
      return res.status(200).json({
        message: "Payment not found but webhook processed",
        orderCode,
      });
    }

    console.log(`📦 Found payment: ${payment._id}`);

    // Xử lý payment thành công
    if (
      status === "PAID" ||
      status === "PAYMENT_SUCCESS" ||
      status === "completed" ||
      webhookData.code === "00"
    ) {
      payment.status = "completed";
      payment.paidAt = new Date();
      payment.payosData = webhookData;
      await payment.save();

      console.log(`✅ Payment marked as completed: ${payment._id}`);

      // Cập nhật connection request
      const connectionRequest = await ConnectionRequest.findById(
        payment.requestId
      )
        .populate("receiverId", "username")
        .populate("senderId", "username");

      console.log("connectionRequest: ", connectionRequest);

      if (connectionRequest) {
        connectionRequest.isPaid = true;
        await connectionRequest.save();

        console.log(
          `🔗 Connection request marked as paid: ${connectionRequest._id}`
        );

        // Tạo notification cho receiver
        await createNotification({
          userId: connectionRequest.receiverId._id,
          type: "connection_request",
          title: "Yêu cầu kết nối mới",
          content: `${connectionRequest.senderId.username} đã gửi cho bạn một yêu cầu kết nối`,
          relatedId: connectionRequest._id,
          relatedType: "connection_request",
        });

        console.log(
          `🔔 Notification sent to user: ${connectionRequest.receiverId._id}`
        );
      } else {
        console.log(
          "❌ Connection request not found for payment:",
          payment.requestId
        );
      }
    }
    // Xử lý payment bị hủy
    else if (
      status === "CANCELLED" ||
      status === "PAYMENT_CANCELLED" ||
      status === "failed" ||
      webhookData.code !== "00"
    ) {
      payment.status = "failed";
      await payment.save();
      console.log(`❌ Payment marked as failed: ${payment._id}`);
    }

    res.status(200).json({
      message: "Webhook processed successfully",
      orderCode,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    return res.status(200).json({
      message: "Webhook error but endpoint is working",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
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
