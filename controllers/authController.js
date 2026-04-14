// controllers/authController.js
const Owner = require('../models/Owner');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register/Setup Owner (First time setup)
// @route   POST /api/auth/setup-owner
const setupOwner = async (req, res) => {
  try {
    const { name, mobile, password, shopName, shopAddress, gstNumber } = req.body;

    // Check if owner already exists
    const ownerExists = await Owner.findOne();
    if (ownerExists) {
      return res.status(400).json({ message: 'Owner already exists' });
    }

    const owner = await Owner.create({
      name,
      mobile,
      password,
      shopName,
      shopAddress,
      gstNumber
    });

    res.status(201).json({
      success: true,
      message: 'Shop owner registered successfully',
      owner: {
        id: owner._id,
        name: owner.name,
        mobile: owner.mobile,
        shopName: owner.shopName
      },
      token: generateToken(owner._id, 'owner')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Owner Login
// @route   POST /api/auth/owner-login
const ownerLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const owner = await Owner.findOne({ mobile });

    if (owner && (await owner.comparePassword(password))) {
      res.json({
        success: true,
        message: 'Owner login successful',
        owner: {
          id: owner._id,
          name: owner.name,
          mobile: owner.mobile,
          shopName: owner.shopName
        },
        token: generateToken(owner._id, 'owner')
      });
    } else {
      res.status(401).json({ message: 'Invalid mobile number or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Customer Login (for mobile app)
// @route   POST /api/auth/customer-login
const customerLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const customer = await Customer.findOne({ mobile });

    if (customer && (await customer.comparePassword(password))) {
      res.json({
        success: true,
        message: 'Customer login successful',
        customer: {
          id: customer._id,
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email
        },
        token: generateToken(customer._id, 'customer')
      });
    } else {
      res.status(401).json({ message: 'Invalid mobile number or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Customer Register (Owner adds customer or customer self registers)
// @route   POST /api/auth/register-customer
const registerCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, password } = req.body;

    const customerExists = await Customer.findOne({ mobile });
    if (customerExists) {
      return res.status(400).json({ message: 'Customer already exists' });
    }

    const customer = await Customer.create({
      name,
      mobile,
      email,
      address,
      password: password || '123456' // Default password
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        mobile: customer.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  setupOwner,
  ownerLogin,
  customerLogin,
  registerCustomer
};