// // models/EMI.js
// const mongoose = require('mongoose');

// const emiSchema = new mongoose.Schema({
//   deviceId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Device',
//     required: true
//   },
//   customerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Customer',
//     required: true
//   },
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   paidAmount: {
//     type: Number,
//     default: 0
//   },
//   remainingAmount: {
//     type: Number,
//     required: true
//   },
//   emiAmount: {
//     type: Number,
//     required: true
//   },
//   totalMonths: {
//     type: Number,
//     required: true
//   },
//   paidMonths: {
//     type: Number,
//     default: 0
//   },
//   startDate: {
//     type: Date,
//     required: true
//   },
//   nextDueDate: {
//     type: Date,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['active', 'completed', 'overdue'],
//     default: 'active'
//   },
//   payments: [
//     {
//       amount: Number,
//       paidDate: Date,
//       month: Number,
//       notes: String
//     }
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('EMI', emiSchema);


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
  
  // Device Price Details
  devicePrice: {
    type: Number,
    default: 0
  },
  downPayment: {
    type: Number,
    default: 0
  },
  financedAmount: {
    type: Number,
    default: 0
  },
  
  // EMI Details
  financeCharge: {
    type: Number,
    default: 10
  },
  financeChargeAmount: {
    type: Number,
    default: 0
  },
  totalPayable: {
    type: Number,
    default: 0
  },
  
  // Legacy field - keep for backward compatibility
  totalAmount: {
    type: Number,
    default: 0  // Changed from required to default
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
  
  // Payment Tracking
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  downPaymentPaid: {
    type: Boolean,
    default: false
  },
  downPaymentDate: {
    type: Date
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  
  // Payment History
  payments: [{
    amount: Number,
    paidDate: Date,
    month: Number,
    type: {
      type: String,
      enum: ['down_payment', 'emi_payment']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card'],
      default: 'cash'
    },
    transactionId: String,
    receiptNumber: String,
    notes: String
  }],
  
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EMI', emiSchema);