const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const fraudAlertController = require('../controllers/fraudAlertController');
const router = require('./transactionRoutes');

router.use(protect);
router.use(restrictTo('compliance_officer', 'admin')); // every route here is compliance-only

router.get('/fraudAlerts', fraudAlertController.getAllFraudAlerts);
router.get('/fraudAlerts/:id', fraudAlertController.getFraudAlert);
router.post('/fraudAlerts', fraudAlertController.createFraudAlert);
router.delete('/fraudAlerts',fraudAlertController.deleteFraudAlert)
router.put('/fraudAlerts/:id',fraudAlertController.updateFraudAlert)
router.put('/fraudAlerts/:id/status', fraudAlertController.updateStatus);
module.exports = router;
