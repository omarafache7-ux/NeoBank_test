import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './context/RequireAuth';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CustomerHome from './pages/CustomerDashboardPage'
import CustomerAccounts from './components/CustomerAccounts'
import CustomerTransfer from './components/CustomerTransfer'
import CustomerBeneficiaries from './components/CustomerBeneficiaries'
import CustomerLoans from './components/CustomerLoans'
import CustomerCard from './components/CustomerCard'
import CustomerNotification from './components/CustomerNotifications'
import CustomerProfile from './components/CustomerProfile'
import AdminUsers from './components/AdminPage'



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<RequireAuth allowedRole={['customer']}/>}>
           <Route path="/customer-dashboard" element={<CustomerHome />} />
           <Route path="/customer-accounts" element={<CustomerAccounts />} />
           <Route path="/customer-transfer" element={<CustomerTransfer />} />
           <Route path="/customer-beneficiaries" element={<CustomerBeneficiaries />} />
           <Route path="/customer-loans" element={<CustomerLoans />} />
           <Route path="/customer-cards" element={<CustomerCard />} />
           <Route path="/customer-profile" element={<CustomerProfile />} />
           <Route path="/customer-notifications" element={<CustomerNotification />} />
          </Route>
          {/* not working will check on it later */}
          <Route element={<RequireAuth allowedRole={['admin','employee']}/>}>
          <Route path="/admin-users" element={<AdminUsers />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;