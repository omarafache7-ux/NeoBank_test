const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const transactionController = require('../controllers/transactionController');

router.use(protect);

router.post('/transactions', restrictTo('customer', 'teller'), transactionController.createTransaction);
router.get('/transactions', restrictTo('teller', 'compliance_officer', 'branch-manager', 'admin'), transactionController.getAllTransactions);
router.get('/transactions/:id', restrictTo('customer', 'teller', 'compliance_officer', 'branch-manager', 'admin'), transactionController.getTransaction);
router.put('/transactions/:id/approve', restrictTo('branch-manager'), transactionController.approve);

module.exports = router;
