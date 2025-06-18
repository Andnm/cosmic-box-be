const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectionRequest',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank', 'momo', 'zalopay', 'vnpay'],
    required: true
  },
  transactionCode: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payosOrderId: {
    type: String,
    unique: true
  },
  payosData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

paymentSchema.index({ requestId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payosOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);