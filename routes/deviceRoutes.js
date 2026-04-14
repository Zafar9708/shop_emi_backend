// // routes/deviceRoutes.js
// const express = require('express');
// const {
//   addDevice,
//   getAllDevices,
//   getDevicesByCustomer,
//   lockDevice,
//   unlockDevice,
//   getDeviceStatus,
//   updateDevice,
//   deleteDevice,
//   getDeviceStats
// } = require('../controllers/deviceController');
// const { protect, isOwner } = require('../middleware/auth');

// const router = express.Router();

// // Public route (for mobile app)
// router.get('/status/:imei', getDeviceStatus);

// // Protected routes (Owner only)
// router.use(protect, isOwner);

// router.post('/add', addDevice);
// router.get('/', getAllDevices);
// router.get('/stats', getDeviceStats);
// router.get('/customer/:customerId', getDevicesByCustomer);
// router.post('/lock/:id', lockDevice);
// router.post('/unlock/:id', unlockDevice);
// router.put('/:id', updateDevice);
// router.delete('/:id', deleteDevice);

// module.exports = router;

// routes/deviceRoutes.js
const express = require('express');
const {
  addDevice,
  getAllDevices,
  getDevicesByCustomer,
  lockDevice,
  unlockDevice,
  getDeviceStatus,
  updateDevice,
  deleteDevice,
  getDeviceStats
} = require('../controllers/deviceController');
const { protect, isOwner } = require('../middleware/auth');
const { uploadMultiple } = require('../config/cloudinary');

const router = express.Router();

// Public route (for mobile app)
router.get('/status/:imei', getDeviceStatus);

// Protected routes (Owner only)
router.use(protect, isOwner);

router.post('/add', uploadMultiple, addDevice);
router.get('/', getAllDevices);
router.get('/stats', getDeviceStats);
router.get('/customer/:customerId', getDevicesByCustomer);
router.post('/lock/:id', lockDevice);
router.post('/unlock/:id', unlockDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

module.exports = router;