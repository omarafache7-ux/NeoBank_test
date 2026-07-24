const express = require('express');
const cardController = require('../controllers/cardController');
const {protect,restrictTo}=require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);

router.get('/cards/mine', restrictTo('customer'), cardController.getMyCards);
router.get('/cards', restrictTo('teller', 'branch_manager', 'admin'), cardController.getAllCards);
router.get('/cards/:id', restrictTo('customer', 'teller', 'branch_manager', 'admin'), cardController.getCard);
router.post('/cards/', restrictTo('customer', 'teller'), cardController.createCard);
router.put('/cards/:id/status', restrictTo('teller', 'compliance_officer', 'admin'), cardController.updateStatus);
router.put('/cards/:id/cancel', restrictTo('customer', 'teller', 'admin'), cardController.cancelCard);
module.exports = router;
