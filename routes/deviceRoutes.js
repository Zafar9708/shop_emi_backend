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
  getDeviceStats,
  getLockedDevices,              // Add this
  getUnlockedDevices,            // Add this
  getDevicesByLockStatus,        // Add this
  getLockStats,                  // Add this
  getCustomerDevicesByLockStatus,
  getDeviceById // Add this
} = require('../controllers/deviceController');
const { protect, isOwner } = require('../middleware/auth');
const { uploadMultiple } = require('../config/cloudinary');

const router = express.Router();

// Public route (for mobile app)
router.get('/status/:imei', getDeviceStatus);

// Protected routes (Owner only)
router.use(protect, isOwner);


// Specific routes (must come before /:id)
router.get('/stats', getDeviceStats);
router.get('/locked', getLockedDevices);                    // Get all locked devices
router.get('/unlocked', getUnlockedDevices);                // Get all unlocked devices
router.get('/filter', getDevicesByLockStatus);              // Filter by lock status with pagination
router.get('/lock-stats', getLockStats);                    // Get lock/unlock statistics
router.get('/customer/:customerId/locked', getCustomerDevicesByLockStatus); // Customer devices by lock status


router.post('/add', uploadMultiple, addDevice);
router.get('/', getAllDevices);
router.get('/stats', getDeviceStats);
router.get('/:id', protect, isOwner, getDeviceById);

router.get('/customer/:customerId', getDevicesByCustomer);
router.post('/lock/:id', lockDevice);
router.post('/unlock/:id', unlockDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);


module.exports = router;