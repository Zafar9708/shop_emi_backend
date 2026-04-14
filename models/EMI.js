// models/EMI.js
const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  emiAmount: {
    type: Number,
    required: true
  },
  totalMonths: {
    type: Number,
    required: true
  },
  paidMonths: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  },
  payments: [
    {
      amount: Number,
      paidDate: Date,
      month: Number,
      notes: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EMI', emiSchema);