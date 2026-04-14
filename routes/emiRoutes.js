// routes/emiRoutes.js
const express = require('express');
const {
  createEMI,
  getAllEMIs,
  getMyEMIs,
  getEMIByDeviceIMEI,
  payEMI,
  checkOverdueEMI,
  getStats
} = require('../controllers/emiController');
const { protect, isOwner, isCustomer } = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, isOwner, createEMI);
router.get('/', protect, isOwner, getAllEMIs);
router.get('/stats', protect, isOwner, getStats);
router.get('/my-emis', protect, isCustomer, getMyEMIs);
router.get('/check-overdue', protect, isOwner, checkOverdueEMI);
router.get('/device/:imei', getEMIByDeviceIMEI);
router.post('/pay/:id', protect, isCustomer, payEMI);

module.exports = router;