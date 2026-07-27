import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerDashboard.css';

function CustomerDashboard() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const user = auth?.user || storedUser;

  
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName || user?.userName || 'Customer';

  const userRole = user?.role || auth?.role || 'Customer';

  // Helper function to safely convert Mongoose Decimal128
  const parseBalance = (balance) => {
    if (balance === null || balance === undefined) return 0;
    if (typeof balance === 'object' && balance.$numberDecimal) {
      return parseFloat(balance.$numberDecimal);
    }
    return parseFloat(balance) || 0;
  };

  const totalBalanceNumber = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);
  const formattedTotalBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalBalanceNumber);


  const unreadCount = notifications.filter((notif) => !notif.isRead && !notif.read).length;

  // Navigation items
  const navItems = [
    { label: 'Dashboard', active: true, path: '/customer-dashboard' },
    { label: 'Accounts', active: true, path: '/customer-accounts' },
    { label: 'Transfer', active: true, path: '/customer-transfer' },
    { label: 'Beneficiaries', active: true, path: '/customer-beneficiaries' },
    { label: 'Loans', active: true, path: '/customer-loans' },
    { label: 'Cards', active: true, path: '/customer-cards' },
    { label: 'Notifications', active: true, path: '/customer-notifications' },
    { label: 'Profile', active: true, path: '/customer-profile' },
    { label: 'Loan Approvals', active: false, path: '#' },
    { label: 'System Settings', active: false, path: '#' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setAuth) setAuth({ token: null, role: null, userId: null, user: null });
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = auth?.token || localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
       
        const [accountsRes, notificationsRes] = await Promise.allSettled([
          axios.get('http://localhost:4000/api/accounts/mine', { headers }),
          axios.get('http://localhost:4000/api/notifications/mine', { headers }),
        ]);

        if (accountsRes.status === 'fulfilled') {
          const resData = accountsRes.value?.data;
          let accountList = 
         (Array.isArray(resData) ? resData : null) ??
          resData?.data?.accounts ??
          resData?.accounts ??
          resData?.data ??
         (resData && typeof resData === 'object' ? [resData] : []);

          setAccounts(accountList);
        } else {
          console.error('Accounts fetch error:', accountsRes.reason);
        }


        if (notificationsRes.status === 'fulfilled') {
          const notifData = notificationsRes.value?.data;
          const notifList = 
          (Array.isArray(notifData) ? notifData : null) ??
          notifData?.notifications ??
           notifData?.data ??
           [];

          setNotifications(notifList);
        } else {
          console.error('Notifications fetch error:', notificationsRes.reason);
        }

      } catch (err) {
        setError(
          err?.response?.data?.message || 
          `Error ${err?.response?.status || ''}: Failed to load dashboard data`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [auth?.token]);

  return (
    <div className="dashboard-wrapper">
      <div className="app-shell">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="brand">NeoBank Core</div>
          <div className="nav-list">
            {navItems.map((item, index) => (
              <div
                key={index}
                className={`nav-item ${item.active ? 'active' : 'disabled'}`}
                onClick={() => item.active && item.path !== '#' && navigate(item.path)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <span className="who">
              Logged in — <strong>{userName}</strong>
            </span>
            <div className="topbar-actions">
              <span className="badge">{userRole}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>

          {/* Page Header */}
          <div className="page-title">Welcome back, {userName}!</div>
          <div className="page-sub">
            Accounts, transfers, loans and cards everything scoped to your own customer profile.
          </div>

          {/* Conditional Alerts / Loading State */}
          {loading && <p>Loading account details...</p>}
          {error && <p className="alert alert-error">{error}</p>}

          {!loading && !error && (
            <>
              {/* Dashboard Summary Cards */}
              <div className="cards">
                <div className="card">
                  <div className="label">Total Balance</div>
                  <div className="value">{formattedTotalBalance}</div>
                </div>
                <div className="card">
                  <div className="label">Active Accounts</div>
                  <div className="value">{accounts.length}</div>
                </div>
                <div className="card" onClick={() => navigate('/customer-notifications')} style={{ cursor: 'pointer' }}>
                  <div className="label">Unread Notifications</div>
                  <div className="value">{unreadCount}</div>
                </div>
              </div>

              {/* Accounts Overview List */}
              <div className="accounts-section">
                <h3 className="section-title">Your Accounts</h3>
                {accounts.length > 0 ? (
                  <div className="cards">
                    {accounts.map((acc, index) => {
                      const balanceFormatted = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: acc.currency || 'USD',
                      }).format(parseBalance(acc.balance));

                      return (
                        <div className="card" key={acc._id || acc.id || index}>
                          <div className="label">
                            {acc.accountType || acc.type || 'Standard Account'}
                          </div>
                          <div className="value">{balanceFormatted}</div>
                          <div className="account-number">
                            Acc No: {acc.accountNumber || acc._id}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data-text">No accounts found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;