// // controllers/emiController.js
// const EMI = require('../models/EMI');
// const Device = require('../models/Device');
// const Customer = require('../models/Customer');






// // @desc    Create EMI plan (Owner only)
// // @route   POST /api/emi/create
// const createEMI = async (req, res) => {
//   try {
//     const { deviceId, totalAmount, emiAmount, totalMonths, startDate } = req.body;

//     const device = await Device.findById(deviceId);
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     // Check if EMI already exists
//     const existingEMI = await EMI.findOne({ deviceId });
//     if (existingEMI) {
//       return res.status(400).json({ message: 'EMI plan already exists for this device' });
//     }

//     const nextDueDate = new Date(startDate);
//     nextDueDate.setMonth(nextDueDate.getMonth() + 1);

//     const emi = await EMI.create({
//       deviceId,
//       customerId: device.customerId,
//       totalAmount,
//       paidAmount: 0,
//       remainingAmount: totalAmount,
//       emiAmount,
//       totalMonths,
//       paidMonths: 0,
//       startDate: new Date(startDate),
//       nextDueDate,
//       status: 'active'
//     });

//     res.status(201).json({
//       success: true,
//       message: 'EMI plan created successfully',
//       emi
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all EMI plans (Owner)
// // @route   GET /api/emi
// const getAllEMIs = async (req, res) => {
//   try {
//     const emis = await EMI.find()
//       .populate('deviceId', 'deviceName imei brand model price')
//       .populate('customerId', 'name mobile email address')
//       .sort('-createdAt');
    
//     res.json({
//       success: true,
//       count: emis.length,
//       emis
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get EMI by customer (for mobile app)
// // @route   GET /api/emi/my-emis
// const getMyEMIs = async (req, res) => {
//   try {
//     const emis = await EMI.find({ customerId: req.user.id })
//       .populate('deviceId', 'deviceName imei brand model isLocked')
//       .sort('-createdAt');
    
//     res.json({
//       success: true,
//       emis
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get EMI details by device (for mobile app)
// // @route   GET /api/emi/device/:imei
// const getEMIByDeviceIMEI = async (req, res) => {
//   try {
//     const device = await Device.findOne({ imei: req.params.imei });
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     const emi = await EMI.findOne({ deviceId: device._id })
//       .populate('deviceId')
//       .populate('customerId');
    
//     if (!emi) {
//       return res.status(404).json({ message: 'EMI plan not found for this device' });
//     }

//     res.json(emi);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Make EMI payment (Customer)
// // @route   POST /api/emi/pay/:id
// const payEMI = async (req, res) => {
//   try {
//     const { amount, notes } = req.body;
//     const emi = await EMI.findById(req.params.id);
    
//     if (!emi) {
//       return res.status(404).json({ message: 'EMI plan not found' });
//     }

//     // Check if customer owns this EMI
//     if (emi.customerId.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     if (emi.status === 'completed') {
//       return res.status(400).json({ message: 'EMI already completed' });
//     }

//     const paidMonth = emi.paidMonths + 1;
    
//     emi.payments.push({
//       amount,
//       paidDate: new Date(),
//       month: paidMonth,
//       notes: notes || `Payment for month ${paidMonth}`
//     });

//     emi.paidAmount += amount;
//     emi.remainingAmount -= amount;
//     emi.paidMonths += 1;

//     const nextDueDate = new Date(emi.nextDueDate);
//     nextDueDate.setMonth(nextDueDate.getMonth() + 1);
//     emi.nextDueDate = nextDueDate;

//     if (emi.paidMonths >= emi.totalMonths) {
//       emi.status = 'completed';
//       await Device.findByIdAndUpdate(emi.deviceId, { 
//         isLocked: false, 
//         status: 'completed' 
//       });
//     }

//     await emi.save();

//     res.json({
//       success: true,
//       message: 'Payment successful',
//       emi: {
//         id: emi._id,
//         paidAmount: emi.paidAmount,
//         remainingAmount: emi.remainingAmount,
//         paidMonths: emi.paidMonths,
//         totalMonths: emi.totalMonths,
//         status: emi.status,
//         nextDueDate: emi.nextDueDate
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Check and auto-lock overdue devices
// // @route   GET /api/emi/check-overdue
// const checkOverdueEMI = async (req, res) => {
//   try {
//     const today = new Date();
//     const overdueEMIs = await EMI.find({
//       status: 'active',
//       nextDueDate: { $lt: today }
//     });

//     for (const emi of overdueEMIs) {
//       await Device.findByIdAndUpdate(emi.deviceId, {
//         isLocked: true,
//         status: 'locked',
//         lastLockedAt: new Date()
//       });
      
//       emi.status = 'overdue';
//       await emi.save();
//     }

//     res.json({
//       success: true,
//       message: `Checked ${overdueEMIs.length} overdue EMIs`,
//       lockedDevices: overdueEMIs.length
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get dashboard stats (Owner)
// // @route   GET /api/emi/stats
// const getStats = async (req, res) => {
//   try {
//     const totalDevices = await Device.countDocuments();
//     const activeDevices = await Device.countDocuments({ status: 'active' });
//     const lockedDevices = await Device.countDocuments({ isLocked: true });
//     const completedDevices = await Device.countDocuments({ status: 'completed' });
    
//     const totalCustomers = await Customer.countDocuments();
    
//     const totalEMIs = await EMI.countDocuments();
//     const activeEMIs = await EMI.countDocuments({ status: 'active' });
//     const completedEMIs = await EMI.countDocuments({ status: 'completed' });
//     const overdueEMIs = await EMI.countDocuments({ status: 'overdue' });
    
//     const totalRevenue = await EMI.aggregate([
//       { $group: { _id: null, total: { $sum: '$paidAmount' } } }
//     ]);
    
//     const pendingRevenue = await EMI.aggregate([
//       { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
//     ]);

//     res.json({
//       devices: {
//         total: totalDevices,
//         active: activeDevices,
//         locked: lockedDevices,
//         completed: completedDevices
//       },
//       customers: {
//         total: totalCustomers
//       },
//       emis: {
//         total: totalEMIs,
//         active: activeEMIs,
//         completed: completedEMIs,
//         overdue: overdueEMIs
//       },
//       revenue: {
//         collected: totalRevenue[0]?.total || 0,
//         pending: pendingRevenue[0]?.total || 0
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   createEMI,
//   getAllEMIs,
//   getMyEMIs,
//   getEMIByDeviceIMEI,
//   payEMI,
//   checkOverdueEMI,
//   getStats
// };


// controllers/emiController.js
const EMI = require('../models/EMI');
const Device = require('../models/Device');
const Customer = require('../models/Customer');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to generate receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP/${year}${month}${day}/${random}`;
};

// @desc    Create EMI plan with down payment (Owner only)
// @route   POST /api/emi/create
const createEMI = async (req, res) => {
  try {
    const { 
      deviceId, 
      downPayment = 0,
      financeCharge = 10,
      totalMonths = 12, 
      startDate,
      paymentMethod = 'cash'
    } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Check if EMI already exists
    const existingEMI = await EMI.findOne({ deviceId });
    if (existingEMI) {
      return res.status(400).json({ success: false, message: 'EMI plan already exists for this device' });
    }

    const devicePrice = device.price;
    
    // Validate down payment
    if (downPayment > devicePrice) {
      return res.status(400).json({ success: false, message: 'Down payment cannot exceed device price' });
    }

    // Calculate EMI details
    const financedAmount = devicePrice - downPayment;
    const financeChargeAmount = (financedAmount * financeCharge) / 100;
    const totalPayable = financedAmount + financeChargeAmount;
    const emiAmount = totalPayable > 0 ? Math.ceil(totalPayable / totalMonths) : 0;

    const nextDueDate = new Date(startDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    // Create payment record for down payment
    const payments = [];
    let downPaymentReceipt = null;
    
    if (downPayment > 0) {
      downPaymentReceipt = {
        amount: downPayment,
        paidDate: new Date(),
        month: 0,
        type: 'down_payment',
        paymentMethod: paymentMethod,
        transactionId: `CASH_${Date.now()}`,
        receiptNumber: generateReceiptNumber(),
        notes: 'Down payment for device purchase'
      };
      payments.push(downPaymentReceipt);
    }

    // Create EMI plan
    const emi = await EMI.create({
      deviceId,
      customerId: device.customerId,
      devicePrice,
      downPayment,
      financedAmount,
      financeCharge,
      financeChargeAmount,
      totalPayable,
      emiAmount,
      totalMonths,
      paidMonths: 0,
      paidAmount: downPayment,
      remainingAmount: totalPayable - downPayment,
      downPaymentPaid: downPayment > 0,
      downPaymentDate: downPayment > 0 ? new Date() : null,
      startDate: new Date(startDate),
      nextDueDate,
      payments,
      status: 'active'
    });

    // Populate for response
    const populatedEmi = await EMI.findById(emi._id)
      .populate('deviceId', 'deviceName imei brand model price')
      .populate('customerId', 'name mobile email address');

    res.status(201).json({
      success: true,
      message: downPayment > 0 ? 'EMI plan created with down payment' : 'EMI plan created successfully',
      emi: populatedEmi,
      downPaymentReceipt: downPaymentReceipt
    });
  } catch (error) {
    console.error('Error creating EMI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all EMI plans (Owner)
// @route   GET /api/emi
const getAllEMIs = async (req, res) => {
  try {
    const emis = await EMI.find()
      .populate('deviceId', 'deviceName imei brand model price')
      .populate('customerId', 'name mobile email address')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: emis.length,
      emis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get EMI by customer (for mobile app)
// @route   GET /api/emi/my-emis
const getMyEMIs = async (req, res) => {
  try {
    const emis = await EMI.find({ customerId: req.user.id })
      .populate('deviceId', 'deviceName imei brand model isLocked')
      .sort('-createdAt');
    
    res.json({
      success: true,
      emis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get EMI details by device (for mobile app)
// @route   GET /api/emi/device/:imei
const getEMIByDeviceIMEI = async (req, res) => {
  try {
    const device = await Device.findOne({ imei: req.params.imei });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const emi = await EMI.findOne({ deviceId: device._id })
      .populate('deviceId')
      .populate('customerId');
    
    if (!emi) {
      return res.status(404).json({ message: 'EMI plan not found for this device' });
    }

    res.json(emi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Make EMI payment (Customer or Owner)
// @route   POST /api/emi/pay/:id
const payEMI = async (req, res) => {
  try {
    const { amount, paymentMethod = 'cash', notes = '' } = req.body;
    const emi = await EMI.findById(req.params.id);
    
    if (!emi) {
      return res.status(404).json({ message: 'EMI plan not found' });
    }

    // Check authorization (owner or customer)
    if (req.user.role === 'customer' && emi.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (emi.status === 'completed') {
      return res.status(400).json({ message: 'EMI already completed' });
    }

    const paidMonth = emi.paidMonths + 1;
    
    const paymentRecord = {
      amount,
      paidDate: new Date(),
      month: paidMonth,
      type: 'emi_payment',
      paymentMethod,
      transactionId: `CASH_${Date.now()}_${paidMonth}`,
      receiptNumber: generateReceiptNumber(),
      notes: notes || `EMI payment for month ${paidMonth}`
    };
    
    emi.payments.push(paymentRecord);
    emi.paidAmount += amount;
    emi.remainingAmount -= amount;
    emi.paidMonths += 1;

    const nextDueDate = new Date(emi.nextDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    emi.nextDueDate = nextDueDate;

    if (emi.paidMonths >= emi.totalMonths) {
      emi.status = 'completed';
      await Device.findByIdAndUpdate(emi.deviceId, { 
        isLocked: false, 
        status: 'completed' 
      });
    }

    await emi.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment: paymentRecord,
      emi: {
        id: emi._id,
        paidAmount: emi.paidAmount,
        remainingAmount: emi.remainingAmount,
        paidMonths: emi.paidMonths,
        totalMonths: emi.totalMonths,
        status: emi.status,
        nextDueDate: emi.nextDueDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check and auto-lock overdue devices
// @route   GET /api/emi/check-overdue
const checkOverdueEMI = async (req, res) => {
  try {
    const today = new Date();
    const overdueEMIs = await EMI.find({
      status: 'active',
      nextDueDate: { $lt: today }
    });

    for (const emi of overdueEMIs) {
      await Device.findByIdAndUpdate(emi.deviceId, {
        isLocked: true,
        status: 'locked',
        lastLockedAt: new Date()
      });
      
      emi.status = 'overdue';
      await emi.save();
    }

    res.json({
      success: true,
      message: `Checked ${overdueEMIs.length} overdue EMIs`,
      lockedDevices: overdueEMIs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats (Owner)
// @route   GET /api/emi/stats
const getStats = async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'active' });
    const lockedDevices = await Device.countDocuments({ isLocked: true });
    const completedDevices = await Device.countDocuments({ status: 'completed' });
    
    const totalCustomers = await Customer.countDocuments();
    
    const totalEMIs = await EMI.countDocuments();
    const activeEMIs = await EMI.countDocuments({ status: 'active' });
    const completedEMIs = await EMI.countDocuments({ status: 'completed' });
    const overdueEMIs = await EMI.countDocuments({ status: 'overdue' });
    
    const totalRevenue = await EMI.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const pendingRevenue = await EMI.aggregate([
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);

    res.json({
      devices: {
        total: totalDevices,
        active: activeDevices,
        locked: lockedDevices,
        completed: completedDevices
      },
      customers: {
        total: totalCustomers
      },
      emis: {
        total: totalEMIs,
        active: activeEMIs,
        completed: completedEMIs,
        overdue: overdueEMIs
      },
      revenue: {
        collected: totalRevenue[0]?.total || 0,
        pending: pendingRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single EMI details with full info
// @route   GET /api/emi/:id
const getEMIDetails = async (req, res) => {
  try {
    const emi = await EMI.findById(req.params.id)
      .populate('deviceId', 'deviceName imei brand model price isLocked status')
      .populate('customerId', 'name mobile email address');
    
    if (!emi) {
      return res.status(404).json({ success: false, message: 'EMI plan not found' });
    }

    res.json({
      success: true,
      emi
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getRecentPayments = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get all EMIs and extract payments
    const emis = await EMI.find()
      .populate('deviceId', 'deviceName imei brand model')
      .populate('customerId', 'name mobile')
      .sort('-createdAt');
    
    // Collect all payments with EMI and customer details
    let allPayments = [];
    
    emis.forEach(emi => {
      if (emi.payments && emi.payments.length > 0) {
        emi.payments.forEach(payment => {
          allPayments.push({
            _id: payment._id,
            amount: payment.amount,
            paidDate: payment.paidDate,
            month: payment.month,
            type: payment.type,
            paymentMethod: payment.paymentMethod,
            receiptNumber: payment.receiptNumber,
            notes: payment.notes,
            emiId: emi._id,
            deviceName: emi.deviceId?.deviceName || 'N/A',
            deviceImei: emi.deviceId?.imei || 'N/A',
            customerName: emi.customerId?.name || 'N/A',
            customerMobile: emi.customerId?.mobile || 'N/A',
            emiAmount: emi.emiAmount,
            totalMonths: emi.totalMonths,
            paidMonths: emi.paidMonths
          });
        });
      }
    });
    
    // Sort by paid date (newest first)
    allPayments.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    
    // Limit results
    const recentPayments = allPayments.slice(0, parseInt(limit));
    
    // Calculate summary
    const totalPaymentsToday = allPayments.filter(p => {
      const today = new Date().toDateString();
      return new Date(p.paidDate).toDateString() === today;
    }).length;
    
    const totalAmountToday = allPayments.filter(p => {
      const today = new Date().toDateString();
      return new Date(p.paidDate).toDateString() === today;
    }).reduce((sum, p) => sum + p.amount, 0);
    
    const totalPaymentsThisMonth = allPayments.filter(p => {
      const now = new Date();
      const paymentDate = new Date(p.paidDate);
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalAmountThisMonth = allPayments.filter(p => {
      const now = new Date();
      const paymentDate = new Date(p.paidDate);
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
      success: true,
      summary: {
        today: {
          count: totalPaymentsToday,
          amount: totalAmountToday
        },
        thisMonth: {
          count: totalPaymentsThisMonth,
          amount: totalAmountThisMonth
        },
        totalPayments: allPayments.length,
        totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0)
      },
      payments: recentPayments
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportsSummary = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      dateFilter = { createdAt: { $gte: yearAgo } };
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Get all EMIs with date filter
    const emis = await EMI.find(dateFilter)
      .populate('deviceId', 'deviceName imei brand model price')
      .populate('customerId', 'name mobile');
    
    // Calculate statistics
    const totalEMIs = emis.length;
    const totalAmount = emis.reduce((sum, e) => sum + e.totalPayable, 0);
    const totalPaid = emis.reduce((sum, e) => sum + e.paidAmount, 0);
    const totalPending = emis.reduce((sum, e) => sum + e.remainingAmount, 0);
    const activeEMIs = emis.filter(e => e.status === 'active').length;
    const completedEMIs = emis.filter(e => e.status === 'completed').length;
    const overdueEMIs = emis.filter(e => e.status === 'overdue').length;
    
    // Collection rate
    const collectionRate = totalAmount > 0 ? (totalPaid / totalAmount * 100).toFixed(2) : 0;
    
    // Payment collection by month
    const monthlyCollection = {};
    emis.forEach(emi => {
      const month = new Date(emi.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyCollection[month]) {
        monthlyCollection[month] = { paid: 0, pending: 0, total: 0 };
      }
      monthlyCollection[month].total += emi.totalPayable;
      monthlyCollection[month].paid += emi.paidAmount;
      monthlyCollection[month].pending += emi.remainingAmount;
    });
    
    // Top customers
    const customerSpending = {};
    emis.forEach(emi => {
      const customerName = emi.customerId?.name || 'Unknown';
      if (!customerSpending[customerName]) {
        customerSpending[customerName] = {
          name: customerName,
          mobile: emi.customerId?.mobile,
          totalAmount: 0,
          paidAmount: 0,
          emiCount: 0
        };
      }
      customerSpending[customerName].totalAmount += emi.totalPayable;
      customerSpending[customerName].paidAmount += emi.paidAmount;
      customerSpending[customerName].emiCount++;
    });
    
    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    
    // Popular devices
    const deviceSales = {};
    emis.forEach(emi => {
      const deviceName = emi.deviceId?.deviceName || 'Unknown';
      if (!deviceSales[deviceName]) {
        deviceSales[deviceName] = {
          name: deviceName,
          count: 0,
          totalValue: 0
        };
      }
      deviceSales[deviceName].count++;
      deviceSales[deviceName].totalValue += emi.totalPayable;
    });
    
    const popularDevices = Object.values(deviceSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    res.json({
      success: true,
      summary: {
        totalEMIs,
        totalAmount,
        totalPaid,
        totalPending,
        activeEMIs,
        completedEMIs,
        overdueEMIs,
        collectionRate: parseFloat(collectionRate)
      },
      monthlyCollection: Object.entries(monthlyCollection).map(([month, data]) => ({
        month,
        ...data
      })),
      topCustomers,
      popularDevices,
      period
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download report as CSV
// @route   GET /api/reports/download
const downloadReportPDF = async (req, res) => {
  try {
    const { type = 'payments', period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo } };
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add Header
    doc.fontSize(20).font('Helvetica-Bold').text(`${type.toUpperCase()} REPORT`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Period: ${period}${period === 'custom' ? ` (${startDate} to ${endDate})` : ''}`, { align: 'center' });
    doc.moveDown(2);
    
    // Add border line
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    if (type === 'payments') {
      // Payment Report
      const emis = await EMI.find(dateFilter)
        .populate('deviceId', 'deviceName imei')
        .populate('customerId', 'name mobile');
      
      // Table headers
      const tableHeaders = ['Date', 'Customer', 'Mobile', 'Device', 'Amount', 'Type'];
      const tableData = [];
      
      emis.forEach(emi => {
        if (emi.payments && emi.payments.length > 0) {
          emi.payments.forEach(payment => {
            tableData.push([
              payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A',
              emi.customerId?.name || 'N/A',
              emi.customerId?.mobile || 'N/A',
              emi.deviceId?.deviceName || 'N/A',
              `₹${(payment.amount || 0).toLocaleString()}`,
              payment.type === 'down_payment' ? 'Down Payment' : `EMI Month ${payment.month}`
            ]);
          });
        }
      });
      
      // Draw table
      drawTable(doc, tableHeaders, tableData);
      
      // Add summary
      const totalAmount = tableData.reduce((sum, row) => sum + parseFloat(row[4].replace('₹', '').replace(/,/g, '')), 0);
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text(`Total Amount: ₹${totalAmount.toLocaleString()}`, { align: 'right' });
      
    } else if (type === 'emis') {
      // EMI Report
      const emis = await EMI.find(dateFilter)
        .populate('deviceId', 'deviceName imei price')
        .populate('customerId', 'name mobile');
      
      const tableHeaders = ['Customer', 'Mobile', 'Device', 'Total', 'Paid', 'Pending', 'Status'];
      const tableData = [];
      let totalAmount = 0;
      let totalPaid = 0;
      let totalPending = 0;
      
      emis.forEach(emi => {
        totalAmount += emi.totalPayable || 0;
        totalPaid += emi.paidAmount || 0;
        totalPending += emi.remainingAmount || 0;
        
        tableData.push([
          emi.customerId?.name || 'N/A',
          emi.customerId?.mobile || 'N/A',
          emi.deviceId?.deviceName || 'N/A',
          `₹${(emi.totalPayable || 0).toLocaleString()}`,
          `₹${(emi.paidAmount || 0).toLocaleString()}`,
          `₹${(emi.remainingAmount || 0).toLocaleString()}`,
          emi.status || 'N/A'
        ]);
      });
      
      drawTable(doc, tableHeaders, tableData);
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Summary:`, { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Amount: ₹${totalAmount.toLocaleString()}`, { align: 'left' });
      doc.text(`Total Paid: ₹${totalPaid.toLocaleString()}`, { align: 'left' });
      doc.text(`Total Pending: ₹${totalPending.toLocaleString()}`, { align: 'left' });
      doc.text(`Collection Rate: ${totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : 0}%`, { align: 'left' });
      
    } else if (type === 'customers') {
      // Customer Report
      const Customer = require('../models/Customer');
      const customers = await Customer.find();
      
      const tableHeaders = ['Name', 'Mobile', 'Email', 'Address', 'Devices', 'Total Spent'];
      const tableData = [];
      let totalCustomers = 0;
      let totalSpent = 0;
      
      for (const customer of customers) {
        const devices = await Device.find({ customerId: customer._id });
        const emis = await EMI.find({ customerId: customer._id });
        const spent = emis.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
        
        totalCustomers++;
        totalSpent += spent;
        
        tableData.push([
          customer.name || 'N/A',
          customer.mobile || 'N/A',
          customer.email || 'N/A',
          (customer.address || 'N/A').substring(0, 30),
          devices.length.toString(),
          `₹${spent.toLocaleString()}`
        ]);
      }
      
      drawTable(doc, tableHeaders, tableData);
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Summary:`, { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Customers: ${totalCustomers}`, { align: 'left' });
      doc.text(`Total Revenue: ₹${totalSpent.toLocaleString()}`, { align: 'left' });
      doc.text(`Average per Customer: ₹${totalCustomers > 0 ? (totalSpent / totalCustomers).toLocaleString() : 0}`, { align: 'left' });
    }
    
    // Add footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text('EMI Safe Management System - Official Report', { align: 'center' });
    doc.text(`Report ID: ${Date.now()}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to draw table in PDF
function drawTable(doc, headers, data) {
  const pageWidth = doc.page.width - 100;
  const colWidth = pageWidth / headers.length;
  let startY = doc.y;
  
  // Draw headers
  doc.fontSize(10).font('Helvetica-Bold');
  headers.forEach((header, i) => {
    doc.text(header, 50 + (i * colWidth), startY, { width: colWidth, align: 'left' });
  });
  
  // Draw header underline
  doc.moveDown();
  const headerEndY = doc.y;
  doc.strokeColor('#000000').lineWidth(0.5).moveTo(50, headerEndY - 2).lineTo(550, headerEndY - 2).stroke();
  
  // Draw data rows
  doc.fontSize(9).font('Helvetica');
  data.forEach((row, rowIndex) => {
    let rowY = doc.y;
    
    // Check if we need a new page
    if (rowY > doc.page.height - 100) {
      doc.addPage();
      rowY = 50;
      // Redraw headers on new page
      headers.forEach((header, i) => {
        doc.text(header, 50 + (i * colWidth), rowY, { width: colWidth, align: 'left' });
      });
      doc.moveDown();
      rowY = doc.y;
    }
    
    row.forEach((cell, cellIndex) => {
      doc.text(cell, 50 + (cellIndex * colWidth), rowY, { width: colWidth, align: 'left' });
    });
    doc.moveDown(0.8);
  });
  
  doc.moveDown();
}

module.exports = {
  createEMI,
  getAllEMIs,
  getMyEMIs,
  getEMIByDeviceIMEI,
  payEMI,
  checkOverdueEMI,
  getStats,
  getEMIDetails,
  getRecentPayments,
  getReportsSummary,
  downloadReportPDF
};