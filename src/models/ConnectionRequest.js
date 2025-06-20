const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
      default: null,
    },
    feeAmount: {
      type: Number,
      default: 20000,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

connectionRequestSchema.index({ senderId: 1 });
connectionRequestSchema.index({ receiverId: 1 });
connectionRequestSchema.index({ status: 1 });

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
