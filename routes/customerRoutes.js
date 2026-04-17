// routes/customerRoutes.js
const express = require('express');
const {
  addCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomer,
  getCustomerByMobile,
  getCustomerStats,     
  getTotalCustomersCount 
} = require('../controllers/customerController');
const { protect, isOwner } = require('../middleware/auth');
const { uploadMultiple } = require('../config/cloudinary');

const router = express.Router();

// All routes require owner authentication
router.use(protect, isOwner);


router.get('/stats', getCustomerStats);           // Add this
router.get('/total', getTotalCustomersCount);     // Add this

// Customer CRUD with image upload
router.post('/add', uploadMultiple, addCustomer);
router.get('/', getAllCustomers);
router.get('/search', searchCustomer);
router.get('/mobile/:mobile', getCustomerByMobile);
router.get('/:id', getCustomerById);
router.put('/:id', uploadMultiple, updateCustomer);
router.delete('/:id', deleteCustomer);
// Stats routes (put these before dynamic routes like /:id)



module.exports = router;