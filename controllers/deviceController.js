// // controllers/deviceController.js
// const Device = require('../models/Device');
// const Customer = require('../models/Customer');

// // @desc    Add new device (Owner only)
// // @route   POST /api/devices/add
// const addDevice = async (req, res) => {
//   try {
//     const { imei, deviceName, brand, model, price, customerMobile, customerName } = req.body;

//     // Find or create customer
//     let customer = await Customer.findOne({ mobile: customerMobile });
    
//     if (!customer) {
//       customer = await Customer.create({
//         name: customerName || 'New Customer',
//         mobile: customerMobile,
//         password: '123456' // Default password
//       });
//     }

//     // Check if device exists
//     const deviceExists = await Device.findOne({ imei });
//     if (deviceExists) {
//       return res.status(400).json({ message: 'Device with this IMEI already exists' });
//     }

//     const device = await Device.create({
//       imei,
//       deviceName,
//       brand,
//       model,
//       price,
//       customerId: customer._id
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Device added successfully',
//       device,
//       customer
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all devices
// // @route   GET /api/devices
// const getAllDevices = async (req, res) => {
//   try {
//     const devices = await Device.find()
//       .populate('customerId', 'name mobile email address')
//       .sort('-createdAt');
    
//     res.json({
//       success: true,
//       count: devices.length,
//       devices
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get devices by customer
// // @route   GET /api/devices/customer/:customerId
// const getDevicesByCustomer = async (req, res) => {
//   try {
//     const devices = await Device.find({ customerId: req.params.customerId });
//     res.json(devices);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Lock device (Owner only)
// // @route   POST /api/devices/lock/:id
// const lockDevice = async (req, res) => {
//   try {
//     const device = await Device.findById(req.params.id);
    
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     device.isLocked = true;
//     device.status = 'locked';
//     device.lastLockedAt = Date.now();
//     await device.save();

//     res.json({
//       success: true,
//       message: 'Device locked successfully',
//       device: {
//         id: device._id,
//         deviceName: device.deviceName,
//         isLocked: device.isLocked
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Unlock device (Owner only)
// // @route   POST /api/devices/unlock/:id
// const unlockDevice = async (req, res) => {
//   try {
//     const device = await Device.findById(req.params.id);
    
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     device.isLocked = false;
//     device.status = 'active';
//     device.lastUnlockedAt = Date.now();
//     await device.save();

//     res.json({
//       success: true,
//       message: 'Device unlocked successfully',
//       device: {
//         id: device._id,
//         deviceName: device.deviceName,
//         isLocked: device.isLocked
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get device lock status (for mobile app - public)
// // @route   GET /api/devices/status/:imei
// const getDeviceStatus = async (req, res) => {
//   try {
//     const device = await Device.findOne({ imei: req.params.imei });
    
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     res.json({
//       imei: device.imei,
//       deviceName: device.deviceName,
//       isLocked: device.isLocked,
//       status: device.status
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Delete device
// // @route   DELETE /api/devices/:id
// const deleteDevice = async (req, res) => {
//   try {
//     await Device.findByIdAndDelete(req.params.id);
//     res.json({
//       success: true,
//       message: 'Device deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   addDevice,
//   getAllDevices,
//   getDevicesByCustomer,
//   lockDevice,
//   unlockDevice,
//   getDeviceStatus,
//   deleteDevice
// };

// controllers/deviceController.js
const Device = require('../models/Device');
const Customer = require('../models/Customer');

// @desc    Add new device with complete customer details (Owner only)
// @route   POST /api/devices/add
const addDevice = async (req, res) => {
  try {
    const { 
      imei, 
      deviceName, 
      brand, 
      model, 
      price, 
      customerMobile, 
      customerName,
      customerFatherName,
      customerMotherName,
      customerEmail,
      customerAddress,
      customerAadhar,
      customerPAN
    } = req.body;

    // Find or create customer with complete details
    let customer = await Customer.findOne({ mobile: customerMobile });
    
    // Get uploaded image URLs from Cloudinary (optional - only if files are provided)
    let customerPhoto = '';
    let aadharPhoto = '';
    let panPhoto = '';
    
    if (req.files) {
      if (req.files.customerPhoto && req.files.customerPhoto[0]) {
        customerPhoto = req.files.customerPhoto[0].path;
      }
      if (req.files.aadharPhoto && req.files.aadharPhoto[0]) {
        aadharPhoto = req.files.aadharPhoto[0].path;
      }
      if (req.files.panPhoto && req.files.panPhoto[0]) {
        panPhoto = req.files.panPhoto[0].path;
      }
    }
    
    if (!customer) {
      // Create new customer with all provided details
      customer = await Customer.create({
        name: customerName || 'New Customer',
        fatherName: customerFatherName || '',
        motherName: customerMotherName || '',
        mobile: customerMobile,
        email: customerEmail || '',
        address: customerAddress || '',
        aadharNumber: customerAadhar || '',
        panNumber: customerPAN || '',
        customerPhoto,
        aadharPhoto,
        panPhoto,
        password: '123456'
      });
    } else {
      // Update existing customer with new details if provided
      let updateData = {};
      if (customerName) updateData.name = customerName;
      if (customerFatherName) updateData.fatherName = customerFatherName;
      if (customerMotherName) updateData.motherName = customerMotherName;
      if (customerEmail) updateData.email = customerEmail;
      if (customerAddress) updateData.address = customerAddress;
      if (customerAadhar) updateData.aadharNumber = customerAadhar;
      if (customerPAN) updateData.panNumber = customerPAN;
      if (customerPhoto) updateData.customerPhoto = customerPhoto;
      if (aadharPhoto) updateData.aadharPhoto = aadharPhoto;
      if (panPhoto) updateData.panPhoto = panPhoto;
      
      if (Object.keys(updateData).length > 0) {
        customer = await Customer.findByIdAndUpdate(
          customer._id, 
          updateData, 
          { new: true }
        );
      }
    }

    // Check if device exists
    const deviceExists = await Device.findOne({ imei });
    if (deviceExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Device with this IMEI already exists' 
      });
    }

    const device = await Device.create({
      imei,
      deviceName,
      brand,
      model,
      price,
      customerId: customer._id
    });

    res.status(201).json({
      success: true,
      message: 'Device added successfully',
      device: {
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        createdAt: device.createdAt
      },
      customer: {
        id: customer._id,
        name: customer.name,
        fatherName: customer.fatherName,
        motherName: customer.motherName,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        aadharNumber: customer.aadharNumber,
        panNumber: customer.panNumber,
        customerPhoto: customer.customerPhoto || null,
        aadharPhoto: customer.aadharPhoto || null,
        panPhoto: customer.panPhoto || null,
        createdAt: customer.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all devices with complete customer details
// @route   GET /api/devices
const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('customerId', 'name mobile email address aadharNumber panNumber')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: devices.length,
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastLockedAt: device.lastLockedAt,
        lastUnlockedAt: device.lastUnlockedAt,
        createdAt: device.createdAt,
        customer: device.customerId ? {
          id: device.customerId._id,
          name: device.customerId.name,
          mobile: device.customerId.mobile,
          email: device.customerId.email,
          address: device.customerId.address,
          aadharNumber: device.customerId.aadharNumber,
          panNumber: device.customerId.panNumber
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get devices by customer with full details
// @route   GET /api/devices/customer/:customerId
const getDevicesByCustomer = async (req, res) => {
  try {
    const devices = await Device.find({ customerId: req.params.customerId })
      .populate('customerId', 'name mobile email address aadharNumber panNumber');
    
    res.json({
      success: true,
      count: devices.length,
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        createdAt: device.createdAt,
        customer: device.customerId
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Lock device (Owner only)
// @route   POST /api/devices/lock/:id
const lockDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('customerId', 'name mobile');
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    device.isLocked = true;
    device.status = 'locked';
    device.lastLockedAt = Date.now();
    await device.save();

    res.json({
      success: true,
      message: `Device ${device.deviceName} locked successfully`,
      device: {
        id: device._id,
        deviceName: device.deviceName,
        imei: device.imei,
        isLocked: device.isLocked,
        status: device.status,
        lockedAt: device.lastLockedAt,
        customer: {
          name: device.customerId.name,
          mobile: device.customerId.mobile
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Unlock device (Owner only)
// @route   POST /api/devices/unlock/:id
const unlockDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('customerId', 'name mobile');
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    device.isLocked = false;
    device.status = 'active';
    device.lastUnlockedAt = Date.now();
    await device.save();

    res.json({
      success: true,
      message: `Device ${device.deviceName} unlocked successfully`,
      device: {
        id: device._id,
        deviceName: device.deviceName,
        imei: device.imei,
        isLocked: device.isLocked,
        status: device.status,
        unlockedAt: device.lastUnlockedAt,
        customer: {
          name: device.customerId.name,
          mobile: device.customerId.mobile
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get device lock status (for mobile app - public)
// @route   GET /api/devices/status/:imei
const getDeviceStatus = async (req, res) => {
  try {
    const device = await Device.findOne({ imei: req.params.imei })
      .populate('customerId', 'name mobile');
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    res.json({
      success: true,
      device: {
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        isLocked: device.isLocked,
        status: device.status,
        customerName: device.customerId?.name || 'Unknown'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update device details (Owner only)
// @route   PUT /api/devices/:id
const updateDevice = async (req, res) => {
  try {
    const { deviceName, brand, model, price, imei } = req.body;
    
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    // Check if IMEI is being changed and if it's already taken
    if (imei && imei !== device.imei) {
      const imeiExists = await Device.findOne({ imei });
      if (imeiExists) {
        return res.status(400).json({ 
          success: false,
          message: 'IMEI already exists on another device' 
        });
      }
    }

    // Update fields
    if (deviceName) device.deviceName = deviceName;
    if (brand) device.brand = brand;
    if (model) device.model = model;
    if (price) device.price = price;
    if (imei) device.imei = imei;

    await device.save();

    res.json({
      success: true,
      message: 'Device updated successfully',
      device: {
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    const deviceName = device.deviceName;
    await Device.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: `Device ${deviceName} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get device statistics (Owner only)
// @route   GET /api/devices/stats
const getDeviceStats = async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'active', isLocked: false });
    const lockedDevices = await Device.countDocuments({ isLocked: true });
    const completedDevices = await Device.countDocuments({ status: 'completed' });
    
    const totalValue = await Device.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const brandWise = await Device.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 }, totalValue: { $sum: '$price' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalDevices,
        active: activeDevices,
        locked: lockedDevices,
        completed: completedDevices
      },
      totalValue: totalValue[0]?.total || 0,
      brandWise
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// controllers/deviceController.js
// Add these new functions before module.exports

// @desc    Get all locked devices
// @route   GET /api/devices/locked
const getLockedDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isLocked: true })
      .populate('customerId', 'name mobile email address')
      .sort('-lastLockedAt');
    
    // Calculate total value of locked devices
    const totalLockedValue = devices.reduce((sum, device) => sum + device.price, 0);
    
    res.json({
      success: true,
      count: devices.length,
      totalValue: totalLockedValue,
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastLockedAt: device.lastLockedAt,
        createdAt: device.createdAt,
        customer: device.customerId ? {
          id: device.customerId._id,
          name: device.customerId.name,
          mobile: device.customerId.mobile,
          email: device.customerId.email,
          address: device.customerId.address
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all unlocked devices (active devices)
// @route   GET /api/devices/unlocked
const getUnlockedDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isLocked: false, status: 'active' })
      .populate('customerId', 'name mobile email address')
      .sort('-createdAt');
    
    // Calculate total value of unlocked devices
    const totalUnlockedValue = devices.reduce((sum, device) => sum + device.price, 0);
    
    res.json({
      success: true,
      count: devices.length,
      totalValue: totalUnlockedValue,
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastUnlockedAt: device.lastUnlockedAt,
        createdAt: device.createdAt,
        customer: device.customerId ? {
          id: device.customerId._id,
          name: device.customerId.name,
          mobile: device.customerId.mobile,
          email: device.customerId.email,
          address: device.customerId.address
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get devices by lock status with pagination and search
// @route   GET /api/devices/filter?status=locked&page=1&limit=10&search=
const getDevicesByLockStatus = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search = '' } = req.query;
    
    // Validate status
    if (!['locked', 'unlocked', 'all'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: locked, unlocked, or all'
      });
    }
    
    // Build query
    let query = {};
    if (status === 'locked') {
      query.isLocked = true;
    } else if (status === 'unlocked') {
      query.isLocked = false;
      query.status = 'active';
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { deviceName: { $regex: search, $options: 'i' } },
        { imei: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Device.countDocuments(query);
    
    const devices = await Device.find(query)
      .populate('customerId', 'name mobile email address')
      .sort(status === 'locked' ? '-lastLockedAt' : '-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Calculate total value of filtered devices
    const totalValue = devices.reduce((sum, device) => sum + device.price, 0);
    
    res.json({
      success: true,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      summary: {
        totalDevices: total,
        totalValue: totalValue,
        averagePrice: total > 0 ? totalValue / total : 0
      },
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastLockedAt: device.lastLockedAt,
        lastUnlockedAt: device.lastUnlockedAt,
        createdAt: device.createdAt,
        customer: device.customerId ? {
          id: device.customerId._id,
          name: device.customerId.name,
          mobile: device.customerId.mobile,
          email: device.customerId.email,
          address: device.customerId.address
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get lock/unlock statistics
// @route   GET /api/devices/lock-stats
const getLockStats = async (req, res) => {
  try {
    // Get counts
    const totalDevices = await Device.countDocuments();
    const lockedDevices = await Device.countDocuments({ isLocked: true });
    const unlockedDevices = await Device.countDocuments({ isLocked: false, status: 'active' });
    const completedDevices = await Device.countDocuments({ status: 'completed' });
    
    // Get recent locks (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentLocks = await Device.countDocuments({
      isLocked: true,
      lastLockedAt: { $gte: last7Days }
    });
    
    // Get most locked devices (devices that have been locked multiple times)
    // Note: This requires tracking lock history, for now just get locked devices
    const mostLockedDevices = await Device.find({ isLocked: true })
      .populate('customerId', 'name mobile')
      .sort('-lastLockedAt')
      .limit(5);
    
    // Calculate percentage
    const lockPercentage = totalDevices > 0 ? (lockedDevices / totalDevices) * 100 : 0;
    
    res.json({
      success: true,
      stats: {
        total: totalDevices,
        locked: lockedDevices,
        unlocked: unlockedDevices,
        completed: completedDevices,
        lockPercentage: parseFloat(lockPercentage.toFixed(2)),
        recentLocks: recentLocks
      },
      recentLockedDevices: mostLockedDevices.map(device => ({
        id: device._id,
        deviceName: device.deviceName,
        imei: device.imei,
        price: device.price,
        lockedAt: device.lastLockedAt,
        customer: device.customerId ? {
          name: device.customerId.name,
          mobile: device.customerId.mobile
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get devices by customer with lock status filter
// @route   GET /api/devices/customer/:customerId/locked?status=locked
const getCustomerDevicesByLockStatus = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query; // 'locked', 'unlocked', 'all'
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Build query
    let query = { customerId };
    if (status === 'locked') {
      query.isLocked = true;
    } else if (status === 'unlocked') {
      query.isLocked = false;
    }
    
    const devices = await Device.find(query)
      .sort('-createdAt');
    
    const lockedCount = devices.filter(d => d.isLocked).length;
    const unlockedCount = devices.filter(d => !d.isLocked).length;
    const totalValue = devices.reduce((sum, d) => sum + d.price, 0);
    
    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        mobile: customer.mobile
      },
      summary: {
        totalDevices: devices.length,
        lockedDevices: lockedCount,
        unlockedDevices: unlockedCount,
        totalValue: totalValue
      },
      devices: devices.map(device => ({
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastLockedAt: device.lastLockedAt,
        lastUnlockedAt: device.lastUnlockedAt,
        createdAt: device.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('customerId', 'name mobile email address aadharNumber panNumber');
    
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: 'Device not found' 
      });
    }
    
    res.json({
      success: true,
      device: {
        id: device._id,
        imei: device.imei,
        deviceName: device.deviceName,
        brand: device.brand,
        model: device.model,
        price: device.price,
        isLocked: device.isLocked,
        status: device.status,
        lastLockedAt: device.lastLockedAt,
        lastUnlockedAt: device.lastUnlockedAt,
        createdAt: device.createdAt,
        customer: device.customerId
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};



// Update module.exports to include new functions
module.exports = {
  addDevice,
  getAllDevices,
  getDevicesByCustomer,
  lockDevice,
  unlockDevice,
  getDeviceStatus,
  updateDevice,
  deleteDevice,
  getDeviceStats,
  getLockedDevices,           // Add this
  getUnlockedDevices,         // Add this
  getDevicesByLockStatus,     // Add this
  getLockStats,               // Add this
  getCustomerDevicesByLockStatus, // Add this
  getDeviceById  // Add this


};