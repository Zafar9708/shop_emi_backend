// models/Customer.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
   fatherName: {  // Added Father's Name
    type: String,
    default: ''
  },
  motherName: {  // Added Mother's Name
    type: String,
    default: ''
  },

  mobile: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    default: ''
  },
   panNumber: {  
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  // Image URLs from Cloudinary
  customerPhoto: {
    type: String,
    default: ''
  },
  aadharPhoto: {
    type: String,
    default: ''
  },
  panPhoto: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
customerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);