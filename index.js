const express = require('express');
const app = express();
const { connectDB } = require('./database');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const branchRoutes = require('./routes/branchRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const cardRoutes = require('./routes/cardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const systemSettingRoutes = require('./routes/systemSettingRoutes');
const fraudAlertRoutes = require('./routes/fraudAlertRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

app.use(express.json());

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/employees', employeeRoutes);
router.use('/branches', branchRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/loans', loanRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/cards', cardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/teams', teamRoutes);
router.use('/system-settings', systemSettingRoutes);
router.use('/fraud-alerts', fraudAlertRoutes);
router.use('/audit-logs', auditLogRoutes);


connectDB();

app.listen(3000, () => {
  console.log('server is running on port 3000');
});
