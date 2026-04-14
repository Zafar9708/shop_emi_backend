// routes/authRoutes.js
const express = require('express');
const {
  setupOwner,
  ownerLogin,
  customerLogin,
  registerCustomer
} = require('../controllers/authController');

const router = express.Router();

router.post('/setup-owner', setupOwner);
router.post('/owner-login', ownerLogin);
router.post('/customer-login', customerLogin);
router.post('/register-customer', registerCustomer);

module.exports = router;