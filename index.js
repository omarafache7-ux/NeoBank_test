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

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/system-settings', systemSettingRoutes);
app.use('/api/fraud-alerts', fraudAlertRoutes);
app.use('/api/audit-logs', auditLogRoutes);


connectDB();

app.listen(3000, () => {
  console.log('server is running on port 3000');
});
