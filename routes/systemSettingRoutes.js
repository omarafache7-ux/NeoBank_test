const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const systemSettingsController = require('../controllers/systemSettingsController');
const router = express.Router();
router.use(protect);
router.use(restrictTo('admin'));

router.get('/systemSettings', systemSettingsController.getSystemSettings);
router.put('/systemSettings', systemSettingsController.updateSystemSettings);const systemSettingController = require('../controllers/systemSettingController');


module.exports = router;
