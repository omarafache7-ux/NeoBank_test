const express = require('express');
const accountController = require('../controllers/accountController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const router = express.Router();

router.use(protect);

router.post('/accounts', restrictTo('teller', 'admin'), accountController.createAccount);
router.get('/accounts/mine', restrictTo('customer'), accountController.getMyAccounts);
router.get('/accounts', restrictTo('teller', 'branch-manager', 'admin'), accountController.getAllAccounts);
router.get('/accounts/:id', restrictTo('customer', 'teller', 'branch-manager', 'admin'), accountController.getAccount);
router.put('/accounts/:id', restrictTo('teller', 'branch-manager', 'admin'), accountController.updateAccount);
router.delete('/accounts/:id', restrictTo('admin'), accountController.deleteAccount);
router.post('/accounts/:id/deposit', restrictTo('customer', 'teller', 'admin'), accountController.deposit);
router.post('/accounts/:id/withdraw', restrictTo('customer', 'teller', 'admin'), accountController.withdraw);

module.exports = router;
