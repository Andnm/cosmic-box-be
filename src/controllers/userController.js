const User = require("../models/User");
const Payment = require("../models/Payment");
const { createPaymentLink } = require("../services/paymentService");
const { createNotification } = require("../services/notificationService");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roleName: user.roleName,
        membership: user.membership,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      user.username = username;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roleName: user.roleName,
        membership: user.membership,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const upgradeToVip = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already VIP
    if (user.membership === 'vip') {
      return res.status(400).json({ 
        error: "User is already VIP member"
      });
    }

    // Create payment link for VIP upgrade
    const paymentLink = await createPaymentLink({
      requestId: req.user._id, // Use user ID as request ID for VIP upgrade
      userId: req.user._id,
      amount: 60000,
      description: "Goi vip",
    });

    res.json({
      message: "VIP upgrade payment link created",
      paymentLink,
      amount: 60000,
      description: "Goi vip"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMembershipStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const membershipInfo = {
      membership: user.membership
    };

    res.json(membershipInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({
      userId: req.user._id,
      description: "Goi vip"
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({
      userId: req.user._id,
      description: "Goi vip"
    });

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

module.exports = {
  getUserProfile,
  updateUserProfile,
  upgradeToVip,
  getMembershipStatus,
  getPaymentHistory
};