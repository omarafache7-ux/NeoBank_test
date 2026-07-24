const express = require('express');
const notificationController = require('../controllers/notificationController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);

router.post('/notifications',restrictTo('teller','branch-manager','admin'),notificationController.createNotification)
router.get('/notifications/:id',notificationController.getNotification)
router.get('/notifications/mine', notificationController.getMyNotifications); // any logged-in role
router.get('/notifications/admin', restrictTo('admin'), notificationController.getAllNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
