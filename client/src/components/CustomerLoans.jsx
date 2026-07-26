import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerLoans.css';

function CustomerLoans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useAuth();

  const [loans, setLoans] = useState([]);
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('12');
  const [purpose, setPurpose] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = 'http://localhost:4000/api/loans';

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
    if (setAuth) setAuth(null);
    navigate('/login');
  };

  const fetchLoans = async () => {
    const token = auth?.token || localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/my-loans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoans(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to load loans:', err);
      setError('Could not load your loan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [auth?.token]);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    setSubmitting(true);
    const token = auth?.token || localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${API_URL}/loans`,
        {
          amount: Number(amount),
          termMonths: Number(termMonths),
          purpose,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status === 'success') {
        setSuccess('Your loan application has been submitted successfully!');
        setAmount('');
        setPurpose('');
        setTermMonths('12');
        fetchLoans();
      }
    } catch (err) {
      console.error('Loan submission failed:', err);
      setError(
        err.response?.data?.message || 'Failed to submit loan application. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusPill = (status) => {
    const statusClasses = {
      pending: 'status-pill pending',
      approved: 'status-pill approved',
      active: 'status-pill approved',
      rejected: 'status-pill rejected',
      defaulted: 'status-pill rejected',
      closed: 'status-pill',
    };
    return <span className={statusClasses[status] || 'status-pill'}>{status}</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">NeoBank</div>
          <nav>
            {navItems.map((item) => {
              const isCurrent = location.pathname === item.path;
              const isDisabled = !item.active;

              return (
                <div
                  key={item.label}
                  className={`nav-item ${isCurrent ? 'active' : ''} ${
                    isDisabled ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    if (item.active && item.path !== '#') {
                      navigate(item.path);
                    }
                  }}
                >
                  {item.label}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="main">
          <header className="topbar">
            <div className="who">
              Welcome back, <strong>{auth?.user?.name || 'Customer'}</strong>
            </div>
            <div className="topbar-actions">
              <span className="badge">Active Session</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <h1 className="page-title">Loan Center</h1>
          <p className="page-sub">
            Apply for a personal loan or review your current application statuses.
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="transfer-container">
            {/* Application Form */}
            <div className="transfer-card">
              <h3 className="card-title">Apply for a Loan</h3>
              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Loan Amount ($)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="termMonths" className="form-label">
                    Term Duration
                  </label>
                  <select
                    id="termMonths"
                    className="form-control"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                    <option value="48">48 Months (4 Years)</option>
                    <option value="60">60 Months (5 Years)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="purpose" className="form-label">
                    Loan Purpose (Optional)
                  </label>
                  <input
                    id="purpose"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Renovation, Education"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-transfer-btn" disabled={submitting}>
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </form>
            </div>

            {/* Applications History List */}
            <div className="transfer-card">
              <h3 className="card-title">Your Loan History</h3>
              {loading ? (
                <p className="no-data-text">Loading loan records...</p>
              ) : loans.length === 0 ? (
                <p className="no-data-text">No active or prior loan applications found.</p>
              ) : (
                <div className="beneficiary-list">
                  {loans.map((loan) => (
                    <div key={loan._id} className="beneficiary-item">
                      <div className="beneficiary-details">
                        <div className="beneficiary-name-wrap">
                          <span className="beneficiary-name">
                            ${Number(loan.principal).toLocaleString()}
                          </span>
                          <span className="beneficiary-tag">{loan.termMonths} Months</span>
                        </div>

                        <span className="beneficiary-acc-info">
                          Rate: {loan.interestRate}% {loan.purpose && `• ${loan.purpose}`}
                        </span>

                        <div className="beneficiary-status-row">
                          <span>Applied: {new Date(loan.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div>{getStatusPill(loan.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerLoans;