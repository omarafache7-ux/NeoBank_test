import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerAccounts.css';

function CustomerAccounts() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState('');


  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const user = auth?.user || storedUser;


  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName || user?.userName || 'Customer';

  const userRole = user?.role || auth?.role || 'Customer';


  const parseBalance = (balance) => {
    if (balance === null || balance === undefined) return 0;
    if (typeof balance === 'object' && balance.$numberDecimal) {
      return parseFloat(balance.$numberDecimal);
    }
    return parseFloat(balance) || 0;
  };


  const formatLogDetails = (details) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    if (details.amount) return `Amount: $${parseBalance(details.amount)}`;
    if (details.message) return details.message;
    if (details.note) return details.note;
    return JSON.stringify(details);
  };


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
    const fetchAccounts = async () => {
      const token = auth?.token || localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:4000/api/accounts/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const resData = response?.data;
        let accountList = 
       (Array.isArray(resData) ? resData : null) ??
       resData?.data?.accounts ??
        resData?.accounts ??
       resData?.data ??
      (resData && typeof resData === 'object' ? [resData] : []);

        setAccounts(accountList);
        if (accountList.length > 0) {
          setSelectedAccount(accountList[0]);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || 
          `Error ${err?.response?.status || ''}: Failed to load accounts`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [auth?.token]);


  useEffect(() => {
    if (!selectedAccount) return;

    const fetchAccountAuditLogs = async () => {
      setLogLoading(true);
      const token = auth?.token || localStorage.getItem('token');
      const accId = selectedAccount._id || selectedAccount.id;

      try {
        const response = await axios.get(`http://localhost:4000/api/audit-logs/entity/Account/${accId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const logs = response?.data?.data || [];
        setAuditLogs(Array.isArray(logs) ? logs : []);
      } catch (err) {
        console.error('Failed to load audit logs for account:', err);
        setAuditLogs([]);
      } finally {
        setLogLoading(false);
      }
    };

    fetchAccountAuditLogs();
  }, [selectedAccount, auth?.token]);

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
                className={`nav-item ${item.path === '/customer-accounts' ? 'selected' : item.active ? 'active' : 'disabled'}`}
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
          <div className="page-title">Your Bank Accounts</div>
          <div className="page-sub">
            View detailed balances, account numbers, and audit activity logs for all your accounts.
          </div>

          {/* Conditional Alerts / Loading State */}
          {loading && <p>Loading account details...</p>}
          {error && <p className="alert alert-error">{error}</p>}

          {!loading && !error && (
            <>
              {/* Accounts List Section */}
              <div className="accounts-section">
                <h3 className="section-title">Select an Account</h3>
                {accounts.length > 0 ? (
                  <div className="cards">
                    {accounts.map((acc, index) => {
                      const isSelected = (selectedAccount?._id || selectedAccount?.id) === (acc._id || acc.id);
                      const balanceFormatted = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: acc.currency || 'USD',
                      }).format(parseBalance(acc.balance));

                      const accountTypeLabel = acc.type || acc.accountType || acc.cardType || 'Standard Account';

                      return (
                        <div
                          key={acc._id || acc.id || index}
                          className={`card ${isSelected ? 'selected-card' : ''}`}
                          onClick={() => setSelectedAccount(acc)}
                        >
                          <div className="label">
                            Type: <strong>{accountTypeLabel.toUpperCase()}</strong>
                          </div>
                          <div className="value">{balanceFormatted}</div>
                          <div className="account-number">
                            Acc No: {acc.accountNumber || acc._id}
                          </div>
                          {acc.status && <div className="account-status">Status: {acc.status}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data-text">No accounts found.</p>
                )}
              </div>

              {/* Selected Account Details & Audit History */}
              {selectedAccount && (
                <div className="account-detail-section">
                  <h3 className="section-title">
                    Audit & Activity Log ({(selectedAccount.type || selectedAccount.accountType || selectedAccount.cardType || 'Account').toUpperCase()} — {selectedAccount.accountNumber || selectedAccount._id})
                  </h3>

                  {logLoading ? (
                    <p>Loading activity log...</p>
                  ) : auditLogs.length > 0 ? (
                    <div className="transactions-list">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log, idx) => {
                            const actorName = log.actorId?.firstName
                              ? `${log.actorId.firstName} ${log.actorId.lastName || ''}`
                              : log.actorId?.email || 'System';

                            return (
                              <tr key={log._id || idx}>
                                <td>
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                                </td>
                                <td><strong>{log.action || 'ACTIVITY'}</strong></td>
                                <td>{actorName}</td>
                                <td>{formatLogDetails(log.details)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data-text">No audit history recorded for this account.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerAccounts;