import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerCard.css';

function CustomerCards() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useAuth();

  const [cards, setCards] = useState([]);
  const [cardType, setCardType] = useState('debit');
  const [pin, setPin] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Standard Express route path (assuming app.use('/api/cards', cardRoutes))
  const API_URL = 'http://localhost:4000/api/cards';

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

  // Fetch accounts to allow selecting which account to issue the card against
  const fetchAccounts = async () => {
    const token = auth?.token || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:4000/api/accounts/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response?.data?.data || response?.data || [];
      const accountList = Array.isArray(data) ? data : [];
      setUserAccounts(accountList);
      
      if (accountList.length > 0) {
        setSelectedAccount(accountList[0]._id || accountList[0].accountNumber);
      }
    } catch (err) {
      console.warn('Could not load customer accounts:', err);
    }
  };

  const fetchCards = async () => {
    const token = auth?.token || localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Safely extract array from backend response envelope
      const rawData = response?.data?.data || response?.data?.cards || response?.data || [];
      setCards(Array.isArray(rawData) ? rawData : []);
      setError('');
    } catch (err) {
      console.error('Failed to load card history:', err);
      setError(
        err.response?.data?.message || 'Could not load your card history. Please check back later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchAccounts();
  }, [auth?.token]);

  const handleRequestCard = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccount) {
      setError('Please select or specify an active account for this card.');
      return;
    }

    if (pin && pin.length !== 4) {
      setError('Last 4 digits must be exactly 4 numbers.');
      return;
    }

    setSubmitting(true);
    const token = auth?.token || localStorage.getItem('token');

    try {
      // Backend createCard expects account, type, and last4
      const response = await axios.post(
        API_URL,
        {
          type: cardType,
          last4: pin || '0000',
          account: selectedAccount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status === 'success' || response.status === 201) {
        setSuccess('Your card request has been submitted successfully!');
        setPin('');
        setCardType('debit');
        fetchCards();
      }
    } catch (err) {
      console.error('Card request failed:', err);
      setError(
        err.response?.data?.message || 'Failed to request new card. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to cancel this card?')) return;

    setError('');
    setSuccess('');
    setCancellingId(cardId);
    const token = auth?.token || localStorage.getItem('token');

    try {
      await axios.put(
        `${API_URL}/${cardId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Card cancelled successfully.');
      fetchCards();
    } catch (err) {
      console.error('Failed to cancel card:', err);
      setError(
        err.response?.data?.message || 'Failed to cancel card. Please try again.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusPill = (status) => {
    const statusClasses = {
      active: 'status-pill approved',
      requested: 'status-pill pending',
      blocked: 'status-pill rejected',
      expired: 'status-pill rejected',
      cancelled: 'status-pill rejected',
    };
    return <span className={statusClasses[status?.toLowerCase()] || 'status-pill'}>{status}</span>;
  };

  const formatCardNumber = (last4) => {
    return last4 ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••';
  };

  return (
    <div className="dashboard-wrapper">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">NeoBank</div>
          <nav>
            {navItems.map((item) => {
              const isCurrent =
                location.pathname === item.path ||
                item.label === 'Cards' ||
                item.path === '/customer-cards';
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

        <main className="main">
          <header className="topbar">
            <div className="who">
              Welcome back, <strong>{auth?.user?.firstName || auth?.user?.name || 'Customer'}</strong>
            </div>
            <div className="topbar-actions">
              <span className="badge">Active Session</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <h1 className="page-title">Card Management</h1>
          <p className="page-sub">
            Request new debit or credit cards and manage your existing cards.
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="transfer-container">
            <div className="transfer-card">
              <h3 className="card-title">Request a New Card</h3>
              <form onSubmit={handleRequestCard}>
                {userAccounts.length > 0 ? (
                  <div className="form-group">
                    <label htmlFor="accountSelect" className="form-label">
                      Select Account
                    </label>
                    <select
                      id="accountSelect"
                      className="form-control"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      {userAccounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.accountNumber} ({acc.type} - {acc.currency || 'USD'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="accountInput" className="form-label">
                      Account ID or Number
                    </label>
                    <input
                      id="accountInput"
                      type="text"
                      className="form-control"
                      placeholder="Enter Account ID or Number"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="cardType" className="form-label">
                    Card Type
                  </label>
                  <select
                    id="cardType"
                    className="form-control"
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                  >
                    <option value="debit">Debit Card</option>
                    <option value="credit">Credit Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pin" className="form-label">
                    Last 4 Digits
                  </label>
                  <input
                    id="pin"
                    type="password"
                    maxLength={4}
                    className="form-control"
                    placeholder="e.g. 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button type="submit" className="submit-transfer-btn" disabled={submitting}>
                  {submitting ? 'Submitting Request...' : 'Request Card'}
                </button>
              </form>
            </div>

            <div className="transfer-card">
              <h3 className="card-title">Your Cards</h3>
              {loading ? (
                <p className="no-data-text">Loading your cards...</p>
              ) : cards.length === 0 ? (
                <p className="no-data-text">No active or requested cards found.</p>
              ) : (
                <div className="beneficiary-list">
                  {cards.map((card) => (
                    <div key={card._id || card.id} className="beneficiary-item">
                      <div className="beneficiary-details">
                        <div className="beneficiary-name-wrap">
                          <span className="beneficiary-name">
                            {formatCardNumber(card.last4)}
                          </span>
                          <span className="beneficiary-tag">
                            {card.type || 'debit'}
                          </span>
                        </div>

                        <span className="beneficiary-acc-info">
                          Account: {card.account?.accountNumber || 'N/A'}
                        </span>
                        
                        <span className="beneficiary-acc-info">
                          Expires: {card.expiryDate ? new Date(card.expiryDate).toLocaleDateString() : 'N/A'}
                        </span>

                        <div className="beneficiary-status-row">
                          <span>Status:</span>
                          {getStatusPill(card.status || 'requested')}
                        </div>
                      </div>

                      {card.status?.toLowerCase() !== 'cancelled' && (
                        <button
                          className="action-cancel-btn"
                          disabled={cancellingId === (card._id || card.id)}
                          onClick={() => handleCancelCard(card._id || card.id)}
                        >
                          {cancellingId === (card._id || card.id)
                            ? 'Cancelling...'
                            : 'Cancel Card'}
                        </button>
                      )}
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

export default CustomerCards;