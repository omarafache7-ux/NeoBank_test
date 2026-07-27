import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerTransfer.css';

function CustomerTransfer() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fallback to localStorage on refresh
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

  // Fetch user's accounts to populate the "From Account" dropdown
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
        let accountList = [];

        if (Array.isArray(resData)) {
          accountList = resData;
        } else if (Array.isArray(resData?.data?.accounts)) {
          accountList = resData.data.accounts;
        } else if (Array.isArray(resData?.accounts)) {
          accountList = resData.accounts;
        } else if (Array.isArray(resData?.data)) {
          accountList = resData.data;
        } else if (resData && typeof resData === 'object') {
          accountList = [resData];
        }

        setAccounts(accountList);
        if (accountList.length > 0) {
          setFromAccountId(accountList[0]._id || accountList[0].id);
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

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fromAccountId) {
      setError('Please select a source account.');
      return;
    }
    if (!toAccountId.trim()) {
      setError('Please enter a target beneficiary account number.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    setSubmitting(true);
    const token = auth?.token || localStorage.getItem('token');

    try {
 
      const selectedAccount = accounts.find((a) => (a._id || a.id) === fromAccountId);
      const currency = selectedAccount?.currency || 'USD';


      const payload = {
        type: 'transfer',
        fromAccountId,
        toAccountId: toAccountId.trim(),
        beneficiaryAccountNumber: toAccountId.trim(),
        amount: parseFloat(amount),
        currency,
      };

      const response = await axios.post(
        'http://localhost:4000/api/transactions/transactionss',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const status = response?.data?.data?.transaction?.status;
      if (status === 'requires_approval') {
        setSuccessMsg('Transfer submitted successfully! This high-value transaction requires approval before completing.');
      } else {
        setSuccessMsg('Transfer completed successfully!');
      }

      // Reset form
      setToAccountId('');
      setAmount('');
      setDescription('');

  
      const refreshRes = await axios.get('http://localhost:4000/api/accounts/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = refreshRes?.data?.data?.accounts || refreshRes?.data?.accounts || refreshRes?.data || [];
      if (Array.isArray(updated) && updated.length > 0) {
        setAccounts(updated);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || 
        'Transfer failed. Ensure beneficiary is approved and account has sufficient funds.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFromAccount = accounts.find(
    (acc) => (acc._id || acc.id) === fromAccountId
  );

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
                className={`nav-item ${item.path === '/customer-transfer' ? 'selected' : item.active ? 'active' : 'disabled'}`}
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
          <div className="page-title">Transfer Funds</div>
          <div className="page-sub">
            Send money instantly to an approved beneficiary account.
          </div>

          {/* Conditional Alerts */}
          {error && <p className="alert alert-error">{error}</p>}
          {successMsg && <p className="alert alert-success">{successMsg}</p>}

          {loading ? (
            <p>Loading accounts...</p>
          ) : (
            <div className="transfer-container">
              <form onSubmit={handleTransfer} className="transfer-card">
                <div className="form-group">
                  <label className="form-label">From Account</label>
                  <select
                    className="form-control"
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((acc) => {
                      const accId = acc._id || acc.id;
                      const accNum = acc.accountNumber || accId;
                      const type = (acc.type || acc.accountType || 'Account').toUpperCase();
                      const bal = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: acc.currency || 'USD',
                      }).format(parseBalance(acc.balance));

                      return (
                        <option key={accId} value={accId}>
                          {type} ({accNum}) — Available: {bal}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedFromAccount && (
                  <div className="account-balance-preview">
                    <span>Available Balance:</span>
                    <strong>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: selectedFromAccount.currency || 'USD',
                      }).format(parseBalance(selectedFromAccount.balance))}
                    </strong>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Beneficiary Account Number / Target ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter approved beneficiary account number"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Note (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Rent, Invoice payment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-transfer-btn"
                  disabled={submitting || accounts.length === 0}
                >
                  {submitting ? 'Processing Transfer...' : 'Complete Transfer'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerTransfer;