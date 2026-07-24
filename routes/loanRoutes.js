const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const loanController = require('../controllers/loanController');

router.use(protect);

router.post('/loans', restrictTo('customer'), loanController.createLoan);
router.get('/loans', restrictTo('loan_officer', 'branch_manager', 'admin'), loanController.getAllLoans);
router.get('/loans/:id', restrictTo('customer', 'loan_officer', 'branch_manager', 'admin'), loanController.getLoan);
router.put('/loans/:id', restrictTo('loan_officer'), loanController.updateLoan);
router.put('/loans/:id/status', restrictTo('loan_officer', 'branch_manager'), loanController.updateStatus);
router.delete('/loans/:id', restrictTo('admin'), loanController.deleteLoan);
module.exports = router;
