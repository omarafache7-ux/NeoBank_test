const express = require('express');
const customerController = require('../controllers/customerController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const router = express.Router();

router.use(protect); // Ensure user is logged in
router.get('/me', restrictTo('customer'), customerController.getMyProfile);
router.put('/me', restrictTo('customer'), customerController.updateCustomer);

//remember i restricted added employee cause we need to test admin
router.post('/create-customers', restrictTo('teller', 'branch-manager', 'admin', 'customer'), customerController.createCustomer);
router.get('/get-Allcustomers', restrictTo('teller', 'branch-manager', 'admin'), customerController.getAllCustomers);
router.get('/get-customer/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.getCustomer);
router.put('/update-customers/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.updateCustomer);

module.exports = router;