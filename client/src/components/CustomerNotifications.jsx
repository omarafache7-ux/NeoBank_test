import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerNotifications.css';

function CustomerNotifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'transaction', 'loan', 'security', 'system'

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handles either app.use('/api/notifications', router) or app.use('/api', router)
  const API_URL = 'http://localhost:4000/api/notifications';

   const userRole =  auth?.role || 'Customer';
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

  const fetchNotifications = async () => {
    const token = auth?.token || localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Tries /mine endpoint
      let response;
      try {
        response = await axios.get(`${API_URL}/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        // Fallback in case route mounted as app.use('/api/notifications', router) vs app.use('/api', router)
        if (err.response?.status === 404) {
          response = await axios.get(`${API_URL}/notifications/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw err;
        }
      }

      const list = response?.data?.data || [];
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(response?.data?.unreadCount ?? list.filter((n) => !n.read).length);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(
        err.response?.data?.message || 'Could not load your notifications. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [auth?.token]);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    const token = auth?.token || localStorage.getItem('token');

    try {
      let endpoint = `${API_URL}/${id}/read`;
      await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(async (err) => {
        if (err.response?.status === 404) {
          await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          throw err;
        }
      });

      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    const token = auth?.token || localStorage.getItem('token');

    try {
      let endpoint = `${API_URL}/read-all`;
      await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(async (err) => {
        if (err.response?.status === 404) {
          await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          throw err;
        }
      });

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      setSuccess('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError('Could not mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, isRead) => {
    const token = auth?.token || localStorage.getItem('token');

    try {
      let endpoint = `${API_URL}/${id}`;
      await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } }).catch(async (err) => {
        if (err.response?.status === 404) {
          await axios.delete(`${API_URL}/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          throw err;
        }
      });

      setNotifications((prev) => prev.filter((item) => item._id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification.');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'unread') return !item.read;
    if (filterType !== 'all') return item.type === filterType;
    return true;
  });

  const getTypeBadge = (type) => {
    const typeClasses = {
      transaction: 'badge-type transaction',
      loan: 'badge-type loan',
      security: 'badge-type security',
      system: 'badge-type system',
    };
    return <span className={typeClasses[type] || 'badge-type'}>{type}</span>;
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
                item.label === 'Notifications' ||
                item.path === '/customer-notifications';
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
              <span className="badge">{userRole}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <div className="notifications-header-row">
            <div>
              <h1 className="page-title">
                Notifications
                {unreadCount > 0 && <span className="unread-counter-badge">{unreadCount}</span>}
              </h1>
              <p className="page-sub">Stay updated with your account activity and announcements.</p>
            </div>

            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="filter-bar">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === 'unread' ? 'active' : ''}`}
              onClick={() => setFilterType('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`filter-btn ${filterType === 'transaction' ? 'active' : ''}`}
              onClick={() => setFilterType('transaction')}
            >
              Transactions
            </button>
            <button
              className={`filter-btn ${filterType === 'loan' ? 'active' : ''}`}
              onClick={() => setFilterType('loan')}
            >
              Loans
            </button>
            <button
              className={`filter-btn ${filterType === 'security' ? 'active' : ''}`}
              onClick={() => setFilterType('security')}
            >
              Security
            </button>
            <button
              className={`filter-btn ${filterType === 'system' ? 'active' : ''}`}
              onClick={() => setFilterType('system')}
            >
              System
            </button>
          </div>

          <div className="notifications-container">
            {loading ? (
              <p className="no-data-text">Loading notifications...</p>
            ) : filteredNotifications.length === 0 ? (
              <p className="no-data-text">No notifications found.</p>
            ) : (
              <div className="notification-list">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`notification-card ${!notif.read ? 'unread' : 'read'}`}
                    onClick={() => handleMarkAsRead(notif._id, notif.read)}
                  >
                    <div className="notification-main">
                      <div className="notification-meta">
                        {getTypeBadge(notif.type)}
                        <span className="notification-time">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                        </span>
                        {!notif.read && <span className="unread-dot" title="Unread" />}
                      </div>

                      <p className="notification-message">{notif.message}</p>
                    </div>

                    <button
                      className="delete-notif-btn"
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif._id, notif.read);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerNotifications;