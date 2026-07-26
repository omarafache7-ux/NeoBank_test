const express = require('express');
const cardController = require('../controllers/cardController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const router = express.Router();

router.use(protect);

router.get('/mine', restrictTo('customer'), cardController.getMyCards);
router.get('/', restrictTo('teller', 'branch-manager', 'admin'), cardController.getAllCards);
router.get('/:id', restrictTo('customer', 'teller', 'branch-manager', 'admin'), cardController.getCard);
router.post('/', restrictTo('customer', 'teller'), cardController.createCard);
router.put('/:id/status', restrictTo('teller', 'compliance_officer', 'admin'), cardController.updateStatus);
router.put('/:id/cancel', restrictTo('customer', 'teller', 'admin'), cardController.cancelCard);

module.exports = router;