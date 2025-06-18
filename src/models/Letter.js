const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'archived'],
    default: 'draft'
  },
  adminReviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminReviewedAt: {
    type: Date
  },
  adminReviewNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

letterSchema.index({ senderId: 1 });
letterSchema.index({ receiverId: 1 });
letterSchema.index({ status: 1 });
letterSchema.index({ adminReviewStatus: 1 });
letterSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Letter', letterSchema);