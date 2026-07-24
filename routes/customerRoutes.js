const express = require('express');
const customerController = require('../controllers/customerController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

// staff-only: browsing/managing every customer
router.post('/customers',restrictTo('teller', 'branch-manager', 'admin','customer'),customerController.createCustomer)
router.get('/customers', restrictTo('teller', 'branch-manager', 'admin'), customerController.getAllCustomers);
router.get('/customers/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.getCustomer);
router.put('/customers/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.updateCustomer);

// a customer updating their own contact info — no restrictTo, since anyone
router.put('/me', restrictTo('customer'), customerController.updateCustomer);

module.exports = router;
