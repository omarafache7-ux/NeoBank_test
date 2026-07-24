const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/users/signup', authController.signUp);
router.post('/users/login', authController.login);


module.exports = router;
