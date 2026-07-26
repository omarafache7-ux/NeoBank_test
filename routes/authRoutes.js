const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleWare');

router.post('/users/signup', authController.signUp);
router.post('/users/login', authController.login);
router.get('/get-Allusers',restrictTo('admin','employee'),authController.getAllUser);


module.exports = router;
