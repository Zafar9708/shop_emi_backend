// // routes/emiRoutes.js
// const express = require('express');
// const {
//   createEMI,
//   getAllEMIs,
//   getMyEMIs,
//   getEMIByDeviceIMEI,
//   payEMI,
//   checkOverdueEMI,
//   getStats
// } = require('../controllers/emiController');
// const { protect, isOwner, isCustomer } = require('../middleware/auth');

// const router = express.Router();

// router.post('/create', protect, isOwner, createEMI);
// router.get('/', protect, isOwner, getAllEMIs);
// router.get('/stats', protect, isOwner, getStats);
// router.get('/my-emis', protect, isCustomer, getMyEMIs);
// router.get('/check-overdue', protect, isOwner, checkOverdueEMI);
// router.get('/device/:imei', getEMIByDeviceIMEI);
// router.post('/pay/:id', protect, isCustomer, payEMI);

// module.exports = router;

// routes/emiRoutes.js
const express = require('express');
const {
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

} = require('../controllers/emiController');
const { protect, isOwner, isCustomer } = require('../middleware/auth');

const router = express.Router();

// ============ OWNER ONLY ROUTES ============
// Create new EMI plan
router.post('/create', protect, isOwner, createEMI);

// Get all EMI plans (with filters)
router.get('/', protect, isOwner, getAllEMIs);

// Get EMI statistics for dashboard
router.get('/stats', protect, isOwner, getStats);

// Check and auto-lock overdue devices
router.get('/check-overdue', protect, isOwner, checkOverdueEMI);
router.get('/recent-payments', protect, isOwner, getRecentPayments);  // Add this route
router.get('/reports/summary', protect, isOwner, getReportsSummary);
router.get('/reports/download-pdf', protect, isOwner, downloadReportPDF);


// ============ CUSTOMER ONLY ROUTES ============
// Get logged-in customer's EMIs
router.get('/my-emis', protect, isCustomer, getMyEMIs);

// Make EMI payment
router.post('/pay/:id', protect, isCustomer, payEMI);

// ============ PUBLIC ROUTES ============
// Get EMI by device IMEI (for mobile app)
router.get('/device/:imei', getEMIByDeviceIMEI);

// ============ DYNAMIC ROUTES (MUST BE LAST) ============
// Get single EMI details (owner can see any, customer can see their own)
router.get('/:id', protect, getEMIDetails);

module.exports = router;