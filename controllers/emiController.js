// controllers/emiController.js
const EMI = require('../models/EMI');
const Device = require('../models/Device');

// @desc    Create EMI plan (Owner only)
// @route   POST /api/emi/create
const createEMI = async (req, res) => {
  try {
    const { deviceId, totalAmount, emiAmount, totalMonths, startDate } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if EMI already exists
    const existingEMI = await EMI.findOne({ deviceId });
    if (existingEMI) {
      return res.status(400).json({ message: 'EMI plan already exists for this device' });
    }

    const nextDueDate = new Date(startDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const emi = await EMI.create({
      deviceId,
      customerId: device.customerId,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      emiAmount,
      totalMonths,
      paidMonths: 0,
      startDate: new Date(startDate),
      nextDueDate,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'EMI plan created successfully',
      emi
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// @desc    Make EMI payment (Customer)
// @route   POST /api/emi/pay/:id
const payEMI = async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const emi = await EMI.findById(req.params.id);
    
    if (!emi) {
      return res.status(404).json({ message: 'EMI plan not found' });
    }

    // Check if customer owns this EMI
    if (emi.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (emi.status === 'completed') {
      return res.status(400).json({ message: 'EMI already completed' });
    }

    const paidMonth = emi.paidMonths + 1;
    
    emi.payments.push({
      amount,
      paidDate: new Date(),
      month: paidMonth,
      notes: notes || `Payment for month ${paidMonth}`
    });

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
      message: 'Payment successful',
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

module.exports = {
  createEMI,
  getAllEMIs,
  getMyEMIs,
  getEMIByDeviceIMEI,
  payEMI,
  checkOverdueEMI,
  getStats
};