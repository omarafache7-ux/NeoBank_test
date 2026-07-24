const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

router.use(protect);
router.use(restrictTo('admin', 'branch_manager')); // every route here is staff-management only

router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/:id', employeeController.getEmployee);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);
module.exports = router;
