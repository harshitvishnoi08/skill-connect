const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Compound index to prevent duplicate requests
connectionSchema.index({ from: 1, to: 1 }, { unique: true });

// Index for faster queries
connectionSchema.index({ to: 1, status: 1 });
connectionSchema.index({ from: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);