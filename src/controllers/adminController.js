const Letter = require("../models/Letter");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { createNotification } = require("../services/notificationService");

const getPendingLetters = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const letters = await Letter.find({
      adminReviewStatus: "pending",
    })
      .populate("senderId", "username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Letter.countDocuments({ adminReviewStatus: "pending" });

    res.json({
      letters,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewLetter = async (req, res) => {
  try {
    const { letterId } = req.params;
    const { status, note } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be approved or rejected" });
    }

    const letter = await Letter.findById(letterId).populate("senderId");
    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    if (letter.adminReviewStatus !== "pending") {
      return res
        .status(400)
        .json({ error: "Letter has already been reviewed" });
    }

    letter.adminReviewStatus = status;
    letter.adminReviewedAt = new Date();
    letter.adminReviewNote = note;

    if (status === "approved") {
      const activeUsers = await User.find({
        isActive: true,
        roleName: "user",
        _id: { $ne: letter.senderId },
      });

      if (activeUsers.length > 0) {
        const randomReceiver =
          activeUsers[Math.floor(Math.random() * activeUsers.length)];
        letter.receiverId = randomReceiver._id;
        letter.status = "sent";
        letter.sentAt = new Date();

        await createNotification({
          userId: randomReceiver._id,
          type: "new_letter",
          title: "Bạn vừa nhận được một lá thư mới!",
          content: "Ai đó đã gửi cho bạn một lá thư ẩn danh.",
          relatedId: letter._id,
          relatedType: "letter",
        });
      }

      await createNotification({
        userId: letter.senderId,
        type: "letter_approved",
        title: "Lá thư của bạn đã được phê duyệt",
        content:
          "Lá thư của bạn đã được phê duyệt và gửi đến một người dùng ngẫu nhiên",
        relatedId: letter._id,
        relatedType: "letter",
      });
    } else {
      await createNotification({
        userId: letter.senderId,
        type: "letter_rejected",
        title: "Lá thư của bạn đã bị từ chối",
        content: note || "Lá thư của bạn đã bị quản trị viên từ chối",
        relatedId: letter._id,
        relatedType: "letter",
      });
    }

    await letter.save();

    res.json({
      message: `Letter ${status} successfully`,
      letter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllLetters = async (req, res) => {
  try {
    const { status, adminReviewStatus, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (adminReviewStatus) query.adminReviewStatus = adminReviewStatus;

    const letters = await Letter.find(query)
      .populate("senderId", "username email")
      .populate("receiverId", "username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Letter.countDocuments(query);

    res.json({
      letters,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate("userId", "username email")
      .populate("requestId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { roleName, isActive, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by role
    if (roleName) query.roleName = roleName;

    // Filter by active status
    if (isActive !== undefined && isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Search by username or email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalLetters,
      pendingLetters,
      approvedLetters,
      rejectedLetters,
      totalPayments,
      completedPayments,
      pendingPayments,
    ] = await Promise.all([
      User.countDocuments({ roleName: "user", isActive: true }),
      Letter.countDocuments(),
      Letter.countDocuments({ adminReviewStatus: "pending" }),
      Letter.countDocuments({ adminReviewStatus: "approved" }),
      Letter.countDocuments({ adminReviewStatus: "rejected" }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "completed" }),
      Payment.countDocuments({ status: "pending" }),
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalLetters,
        pendingLetters,
        approvedLetters,
        rejectedLetters,
        totalPayments,
        completedPayments,
        pendingPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPendingLetters,
  reviewLetter,
  getAllLetters,
  getPayments,
  getAllUsers,
  getDashboardStats,
};
