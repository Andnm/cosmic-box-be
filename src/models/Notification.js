const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['connection_request', 'request_accepted', 'request_rejected', 'new_letter', 'new_message', 'letter_approved', 'letter_rejected']
  },
  title: {
    type: String,
    required: true,
    maxlength: 255
  },
  content: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['connection_request', 'letter', 'message', 'conversation']
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);