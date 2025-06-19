const Letter = require("../models/Letter");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createNotification } = require("../services/notificationService");

const createLetter = async (req, res) => {
  try {
    const { content, status } = req.body;

    const letter = new Letter({
      senderId: req.user._id,
      content,
      status: status || "draft", 
    });

    await letter.save();

    await createNotification(
      {
        userId: null,
        type: "new_letter",
        title: "New Letter Submitted for Review",
        content: `A new letter has been submitted by ${req.user.username}`,
        relatedId: letter._id,
        relatedType: "letter",
      },
      "admin"
    );

    res.status(201).json({
      message: "Letter created and submitted for review",
      letter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyLetters = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { senderId: req.user._id };

    if (status) query.status = status;

    const letters = await Letter.find(query)
      .populate("receiverId", "username")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Letter.countDocuments(query);

    res.json({
      letters,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReceivedLetters = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const letters = await Letter.find({
      receiverId: req.user._id,
      status: "sent",
      adminReviewStatus: "approved",
    })
      .populate("senderId", "username")
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Letter.countDocuments({
      receiverId: req.user._id,
      status: "sent",
      adminReviewStatus: "approved",
    });

    res.json({
      letters,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const archiveLetter = async (req, res) => {
  try {
    const { letterId } = req.params;

    const letter = await Letter.findOne({
      _id: letterId,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    });

    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    letter.status = "archived";
    await letter.save();

    res.json({ message: "Letter archived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDraftLetter = async (req, res) => {
  try {
    const { letterId } = req.params;

    const letter = await Letter.findOne({
      _id: letterId,
      senderId: req.user._id,
      status: "draft",
    });

    if (!letter) {
      return res.status(404).json({ error: "Draft letter not found" });
    }

    await Letter.findByIdAndDelete(letterId);

    res.json({ message: "Draft letter deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLetter,
  getMyLetters,
  getReceivedLetters,
  archiveLetter,
  deleteDraftLetter,
};
