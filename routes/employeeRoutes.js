const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const employeeController = require('../controllers/employeeController');
const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'branch-manager')); // every route here is staffmanagement only

router.get('/get-Allemployess', employeeController.getAllEmployees);
router.get('/get-employee/:id', employeeController.getEmployee);
router.post('/create-employees', employeeController.createEmployee);
router.put('/update-employees/:id', employeeController.updateEmployee);
router.delete('/delete-employees/:id', employeeController.deleteEmployee);
module.exports = router;
