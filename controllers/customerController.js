// controllers/customerController.js
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const EMI = require('../models/EMI');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Add new customer (with optional images)
// @route   POST /api/customers/add
const addCustomer = async (req, res) => {
  try {
    const { 
      name, 
      fatherName,
      motherName,
      mobile, 
      email, 
      address, 
      password, 
      aadharNumber, 
      panNumber 
    } = req.body;

    // Check if customer already exists
    const customerExists = await Customer.findOne({ mobile });
    if (customerExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer with this mobile number already exists' 
      });
    }

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

    const customer = await Customer.create({
      name,
      fatherName: fatherName || '',
      motherName: motherName || '',
      mobile,
      email: email || '',
      address: address || '',
      password: password || '123456',
      aadharNumber: aadharNumber || '',
      panNumber: panNumber || '',
      customerPhoto,
      aadharPhoto,
      panPhoto
    });

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
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

// @desc    Get all customers with their devices and EMI details
// @route   GET /api/customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort('-createdAt');
    
    // Get devices and EMI for each customer
    const customersWithDetails = await Promise.all(
      customers.map(async (customer) => {
        const devices = await Device.find({ customerId: customer._id });
        
        const devicesWithEMI = await Promise.all(
          devices.map(async (device) => {
            const emi = await EMI.findOne({ deviceId: device._id });
            return {
              ...device.toObject(),
              emi: emi ? {
                id: emi._id,
                totalAmount: emi.totalAmount,
                paidAmount: emi.paidAmount,
                remainingAmount: emi.remainingAmount,
                emiAmount: emi.emiAmount,
                totalMonths: emi.totalMonths,
                paidMonths: emi.paidMonths,
                nextDueDate: emi.nextDueDate,
                status: emi.status
              } : null
            };
          })
        );
        
        return {
          ...customer.toObject(),
          devices: devicesWithEMI,
          totalDevices: devices.length,
          totalDeviceValue: devices.reduce((sum, d) => sum + d.price, 0),
          activeEMIs: devicesWithEMI.filter(d => d.emi && d.emi.status === 'active').length
        };
      })
    );
    
    res.json({
      success: true,
      count: customersWithDetails.length,
      customers: customersWithDetails
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single customer with full details
// @route   GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Get all devices of this customer
    const devices = await Device.find({ customerId: customer._id });
    
    // Get EMI details for each device
    const devicesWithEMI = await Promise.all(
      devices.map(async (device) => {
        const emi = await EMI.findOne({ deviceId: device._id });
        return {
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
            createdAt: device.createdAt
          },
          emi: emi ? {
            id: emi._id,
            totalAmount: emi.totalAmount,
            paidAmount: emi.paidAmount,
            remainingAmount: emi.remainingAmount,
            emiAmount: emi.emiAmount,
            totalMonths: emi.totalMonths,
            paidMonths: emi.paidMonths,
            startDate: emi.startDate,
            nextDueDate: emi.nextDueDate,
            status: emi.status,
            payments: emi.payments
          } : null
        };
      })
    );

    // Calculate summary
    const totalDeviceValue = devices.reduce((sum, d) => sum + d.price, 0);
    const totalPaid = devicesWithEMI.reduce((sum, item) => 
      sum + (item.emi?.paidAmount || 0), 0);
    const totalRemaining = devicesWithEMI.reduce((sum, item) => 
      sum + (item.emi?.remainingAmount || 0), 0);
    const activeEMIs = devicesWithEMI.filter(item => 
      item.emi && item.emi.status === 'active').length;
    const completedEMIs = devicesWithEMI.filter(item => 
      item.emi && item.emi.status === 'completed').length;

    res.json({
      success: true,
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
      },
      summary: {
        totalDevices: devices.length,
        totalDeviceValue,
        totalPaid,
        totalRemaining,
        activeEMIs,
        completedEMIs
      },
      devices: devicesWithEMI
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update customer details (with optional image upload)
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { 
      name, 
      fatherName,
      motherName,
      mobile, 
      email, 
      address, 
      aadharNumber, 
      panNumber,
      password 
    } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Check if mobile number is being changed and if it's already taken
    if (mobile && mobile !== customer.mobile) {
      const mobileExists = await Customer.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mobile number already in use by another customer' 
        });
      }
    }

    // Handle image uploads (optional) - delete old images only if new ones are uploaded
    if (req.files) {
      if (req.files.customerPhoto && req.files.customerPhoto[0]) {
        if (customer.customerPhoto) {
          const publicId = getPublicIdFromUrl(customer.customerPhoto);
          if (publicId) await deleteImage(publicId);
        }
        customer.customerPhoto = req.files.customerPhoto[0].path;
      }
      
      if (req.files.aadharPhoto && req.files.aadharPhoto[0]) {
        if (customer.aadharPhoto) {
          const publicId = getPublicIdFromUrl(customer.aadharPhoto);
          if (publicId) await deleteImage(publicId);
        }
        customer.aadharPhoto = req.files.aadharPhoto[0].path;
      }
      
      if (req.files.panPhoto && req.files.panPhoto[0]) {
        if (customer.panPhoto) {
          const publicId = getPublicIdFromUrl(customer.panPhoto);
          if (publicId) await deleteImage(publicId);
        }
        customer.panPhoto = req.files.panPhoto[0].path;
      }
    }

    // Update fields
    if (name) customer.name = name;
    if (fatherName !== undefined) customer.fatherName = fatherName;
    if (motherName !== undefined) customer.motherName = motherName;
    if (mobile) customer.mobile = mobile;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (aadharNumber !== undefined) customer.aadharNumber = aadharNumber;
    if (panNumber !== undefined) customer.panNumber = panNumber;
    if (password) customer.password = password;

    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
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

// @desc    Delete customer (with images from Cloudinary)
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Delete images from Cloudinary (only if they exist)
    if (customer.customerPhoto) {
      const publicId = getPublicIdFromUrl(customer.customerPhoto);
      if (publicId) await deleteImage(publicId);
    }
    if (customer.aadharPhoto) {
      const publicId = getPublicIdFromUrl(customer.aadharPhoto);
      if (publicId) await deleteImage(publicId);
    }
    if (customer.panPhoto) {
      const publicId = getPublicIdFromUrl(customer.panPhoto);
      if (publicId) await deleteImage(publicId);
    }

    // Check if customer has any devices
    const devices = await Device.find({ customerId: customer._id });
    
    if (devices.length > 0) {
      // Delete all EMI records for these devices
      for (const device of devices) {
        await EMI.deleteMany({ deviceId: device._id });
      }
      // Delete all devices
      await Device.deleteMany({ customerId: customer._id });
    }

    // Delete customer
    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Customer deleted successfully along with ${devices.length} devices and their EMI records`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Search customer by mobile or name
// @route   GET /api/customers/search?q=mobileOrName
const searchCustomer = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const customers = await Customer.find({
      $or: [
        { mobile: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      count: customers.length,
      customers: customers.map(c => ({
        id: c._id,
        name: c.name,
        fatherName: c.fatherName,
        motherName: c.motherName,
        mobile: c.mobile,
        email: c.email,
        address: c.address,
        aadharNumber: c.aadharNumber,
        panNumber: c.panNumber,
        customerPhoto: c.customerPhoto || null,
        aadharPhoto: c.aadharPhoto || null,
        panPhoto: c.panPhoto || null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get customer by mobile (quick lookup)
// @route   GET /api/customers/mobile/:mobile
const getCustomerByMobile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ mobile: req.params.mobile });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const devices = await Device.find({ customerId: customer._id });

    res.json({
      success: true,
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
        panPhoto: customer.panPhoto || null
      },
      devices: devices.map(d => ({
        id: d._id,
        deviceName: d.deviceName,
        imei: d.imei,
        price: d.price,
        isLocked: d.isLocked
      })),
      totalDevices: devices.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  addCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomer,
  getCustomerByMobile
};