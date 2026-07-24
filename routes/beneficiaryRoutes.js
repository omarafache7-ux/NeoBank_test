const express = require('express');
const beneficiaryController = require('../controllers/beneficiaryController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);
router.post('/beneficiaries',restrictTo('customer'),beneficiaryController.createBeneficiary);
router.get('/beneficiaries', restrictTo('customer', 'teller', 'compliance_officer', 'admin'), beneficiaryController.getAllBeneficiaries);
router.get('/beneficiaries/:id', restrictTo('customer', 'teller', 'compliance_officer', 'admin'), beneficiaryController.getBeneficiary);
router.put('/beneficiaries/:id', restrictTo('customer'), beneficiaryController.updateBeneficiary);
router.put('/beneficiaries/:id/status', restrictTo('teller', 'compliance_officer'), beneficiaryController.updateStatus);
router.delete('/beneficiaries/:id', restrictTo('customer', 'admin'), beneficiaryController.deleteBeneficiary);

module.exports = router;
