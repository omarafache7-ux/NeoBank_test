const express = require('express');
const notificationController = require('../controllers/notificationController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);

router.post('/notifications',restrictTo('teller','branch-manger','admin'),notificationController.createNotification)
router.get('/notifications',notificationController.getNotification)
router.get('/notifications/mine', notificationController.getMyNotifications); // any logged-in role
router.get('/notifications', restrictTo('admin'), notificationController.getAllNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
