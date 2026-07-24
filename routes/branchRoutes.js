const express = require('express');
const branchController = require('../controllers/branchController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');

const router = express.Router();

router.use(protect);

router.get('/branches', restrictTo('teller', 'loan_officer', 'compliance_officer', 'branch-manager', 'admin'), branchController.getAllBranches);
router.get('/branches/:id', restrictTo('teller', 'loan_officer', 'compliance_officer', 'branch-manager', 'admin'), branchController.getBranch);
router.post('/branches', restrictTo('admin'), branchController.createBranch);
router.put('/branches/:id', restrictTo('admin'), branchController.updateBranch);
router.delete('/branches/:id', restrictTo('admin'), branchController.deleteBranch);
module.exports = router;
