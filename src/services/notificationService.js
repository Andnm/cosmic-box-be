const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (notificationData, targetRole = null) => {
  try {
    if (targetRole === 'admin') {
      const admins = await User.find({ roleName: 'admin', isActive: true });
      
      const notifications = admins.map(admin => ({
        ...notificationData,
        userId: admin._id
      }));

      await Notification.insertMany(notifications);
      return notifications;
    } else {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const sendRealTimeNotification = (io, userId, notification) => {
  if (io) {
    io.to(userId.toString()).emit('newNotification', notification);
  }
};

module.exports = {
  createNotification,
  sendRealTimeNotification
};