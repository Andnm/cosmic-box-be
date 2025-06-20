const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const query = { userId: req.user._id };

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    // Populate connection request data for connection_request type notifications
    const populatedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const notificationObj = notification.toObject();

        // Check if this notification is related to a connection request
        if (
          (notification.type === "connection_request" ||
            notification.type === "request_accepted" ||
            notification.type === "request_rejected") &&
          notification.relatedType === "connection_request" &&
          notification.relatedId
        ) {
          try {
            const ConnectionRequest = require("../models/ConnectionRequest");
            const connectionRequest = await ConnectionRequest.findById(
              notification.relatedId
            )
              .populate("senderId", "username email")
              .populate("receiverId", "username email");

            if (connectionRequest) {
              notificationObj.connectionRequest = connectionRequest;
            }
          } catch (error) {
            console.error("Error populating connection request:", error);
          }
        }

        return notificationObj;
      })
    );

    res.json({
      notifications: populatedNotifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: req.user._id,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
