const express = require('express');
const accountController = require('../controllers/accountController');
const authMiddleWare = require('../middleware/authMiddleWare');
const router = express.Router();

router.use(protect);

router.post('/accounts',accountController.createAccount);
router.get('/accounts',authMiddleWare.restrictTo('teller','branch-manager','admin'),accountController.getAllAccounts)
router.get('/accounts/:id',authMiddleWare.restrictTo('customer','teller','branch-manager','admin'),accountController.getAccount);
router.put('/accounts/:id',authMiddleWare.restrictTo('teller','branch-manager','admin'),accountController.updateAccount);
router.delete('/accounts/:id',authMiddleWare.restrictTo('admin',accountController.deleteAccount));
router.post('/accounts/:id/deposit',authMiddleWare.restrictTo('customer','teller','admin'),accountController.deposit)
router.post('/accounts/:id/withdraw',authMiddleWare.restrictTo('customer', 'teller', 'admin'), accountController.withdraw);

module.exports = router;
