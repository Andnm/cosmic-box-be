const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectionRequest',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  chatboxName: {
    type: String,
    maxlength: 100
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

conversationSchema.index({ requestId: 1 });
conversationSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);