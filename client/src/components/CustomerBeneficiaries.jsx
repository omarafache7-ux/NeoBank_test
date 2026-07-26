import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerBeneficiaries.css';

function CustomerBeneficiaries() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');

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

  const fetchBeneficiaries = async () => {
    const token = auth?.token || localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Matching the double path: /api/beneficiaries/beneficiaries
      const response = await axios.get('http://localhost:4000/api/beneficiaries/beneficiaries', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = response?.data;
      let list = [];

      if (Array.isArray(resData)) {
        list = resData;
      } else if (Array.isArray(resData?.data?.beneficiaries)) {
        list = resData.data.beneficiaries;
      } else if (Array.isArray(resData?.beneficiaries)) {
        list = resData.beneficiaries;
      } else if (Array.isArray(resData?.data)) {
        list = resData.data;
      }

      setBeneficiaries(list);
    } catch (err) {
      setError(
        err?.response?.data?.message || 
        `Error ${err?.response?.status || ''}: Failed to load beneficiaries`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [auth?.token]);

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!beneficiaryAccountNumber.trim()) {
      setError('Please enter the beneficiary account number.');
      return;
    }
    if (!beneficiaryName.trim()) {
      setError('Please enter the beneficiary full name.');
      return;
    }

    setSubmitting(true);
    const token = auth?.token || localStorage.getItem('token');

    try {
      const payload = {
        beneficiaryAccountNumber: beneficiaryAccountNumber.trim(),
        beneficiaryName: beneficiaryName.trim(),
        bankName: bankName.trim() || undefined,
        nickname: nickname.trim() || undefined,
      };

      // Matching double path endpoint: /api/beneficiaries/beneficiaries
      const response = await axios.post(
        'http://localhost:4000/api/beneficiaries/beneficiaries',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(
        response?.data?.message || 'Beneficiary added successfully! Waiting for approval.'
      );

      // Reset form fields
      setBeneficiaryAccountNumber('');
      setBeneficiaryName('');
      setBankName('');
      setNickname('');

      // Refresh beneficiary list
      fetchBeneficiaries();
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to add beneficiary. Please check your inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBeneficiary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) return;

    const token = auth?.token || localStorage.getItem('token');
    setError('');
    setSuccessMsg('');

    try {
      // Matching double path endpoint: /api/beneficiaries/beneficiaries/:id
      await axios.delete(`http://localhost:4000/api/beneficiaries/beneficiaries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg('Beneficiary removed successfully.');
      fetchBeneficiaries();
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to delete beneficiary.'
      );
    }
  };

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
                className={`nav-item ${item.path === '/customer-beneficiaries' ? 'selected' : item.active ? 'active' : 'disabled'}`}
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
          <div className="page-title">Manage Beneficiaries</div>
          <div className="page-sub">
            Add and manage authorized target accounts for quick transfers.
          </div>

          {/* Conditional Alerts */}
          {error && <p className="alert alert-error">{error}</p>}
          {successMsg && <p className="alert alert-success">{successMsg}</p>}

          <div className="transfer-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Add Beneficiary Form */}
            <form onSubmit={handleAddBeneficiary} className="transfer-card">
              <h3 style={{ marginBottom: '15px' }}>Add New Beneficiary</h3>
              
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter target account number"
                  value={beneficiaryAccountNumber}
                  onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Beneficiary Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Name (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Central Bank / Internal"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nickname (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Landlord, Sister"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="submit-transfer-btn"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Beneficiary'}
              </button>
            </form>

            {/* Beneficiaries List */}
            <div className="transfer-card">
              <h3 style={{ marginBottom: '15px' }}>Your Beneficiaries</h3>
              {loading ? (
                <p>Loading beneficiaries...</p>
              ) : beneficiaries.length === 0 ? (
                <p style={{ color: '#666' }}>No beneficiaries added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {beneficiaries.map((b) => {
                    const id = b._id || b.id;
                    return (
                      <div
                        key={id}
                        style={{
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{b.beneficiaryName || b.nickname || 'Unnamed'}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Acc: {b.beneficiaryAccountNumber} {b.bankName ? `| ${b.bankName}` : ''}
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '4px' }}>
                            Status: <span style={{ 
                              fontWeight: 'bold', 
                              color: b.status === 'approved' ? 'green' : b.status === 'rejected' ? 'red' : 'orange' 
                            }}>{b.status || 'pending'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteBeneficiary(id)}
                          style={{
                            background: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerBeneficiaries;