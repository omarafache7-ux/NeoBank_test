const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const systemSettingsController = require('../controllers/systemSettingsController');
const router = express.Router();
router.use(protect);
router.use(restrictTo('admin'));

router.get('/systemSettings', systemSettingsController.getSystemSettings);
router.put('/systemSettings', systemSettingsController.updateSystemSettings);


module.exports = router;
