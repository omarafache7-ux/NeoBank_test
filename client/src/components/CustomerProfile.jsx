import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerProfile.css';

function CustomerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: {
      country: '',
      city: '',
      street: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = 'http://localhost:4000/api/customers';

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

  const fetchProfile = async () => {
    const token = auth?.token || localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const customerData = response?.data?.data || null;
      if (customerData) {
        setProfile(customerData);
        setFormData({
          phone: customerData.phone || '',
          address: {
            country: customerData.address?.country || '',
            city: customerData.address?.city || '',
            street: customerData.address?.street || '',
          },
        });
      }
      setError('');
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(
        err.response?.data?.message || 'Could not load your profile data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [auth?.token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const token = auth?.token || localStorage.getItem('token');

    try {
      const response = await axios.put(`${API_URL}/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status === 'success') {
        setSuccess('Profile updated successfully!');
        if (response.data?.data) {
          setProfile(response.data.data);
        }
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(
        err.response?.data?.message || 'Failed to update profile. Please check your inputs.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getKycBadge = (status) => {
    const statusClasses = {
      verified: 'kyc-pill verified',
      pending: 'kyc-pill pending',
      rejected: 'kyc-pill rejected',
    };
    return (
      <span className={statusClasses[status?.toLowerCase()] || 'kyc-pill'}>
        {status || 'pending'}
      </span>
    );
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
                item.label === 'Profile' ||
                item.path === '/customer-profile';
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
              Welcome back,{' '}
              <strong>
                {profile?.user?.firstName || auth?.user?.firstName || auth?.user?.name || 'Customer'}
              </strong>
            </div>
            <div className="topbar-actions">
              <span className="badge">{userRole}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <h1 className="page-title">Personal Profile</h1>
          <p className="page-sub">View your account credentials and update contact details.</p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <p className="no-data-text">Loading profile information...</p>
          ) : (
            <div className="profile-grid">
              <div className="profile-card readonly-card">
                <h3 className="card-title">Identity & Verification</h3>
                
                <div className="profile-info-group">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">
                    {profile?.user?.firstName} {profile?.user?.lastName}
                  </span>
                </div>

                <div className="profile-info-group">
                  <span className="info-label">Username</span>
                  <span className="info-value">@{profile?.user?.userName || 'N/A'}</span>
                </div>

                <div className="profile-info-group">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{profile?.user?.email}</span>
                </div>

                <div className="profile-info-group">
                  <span className="info-label">National ID</span>
                  <span className="info-value">{profile?.nationalId || 'N/A'}</span>
                </div>

                <div className="profile-info-group">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">
                    {profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="profile-info-group">
                  <span className="info-label">KYC Verification Status</span>
                  <div className="kyc-wrapper">{getKycBadge(profile?.kycStatus)}</div>
                </div>

                {profile?.branchId && (
                  <div className="profile-info-group">
                    <span className="info-label">Assigned Branch</span>
                    <span className="info-value">
                      {profile.branchId.name} ({profile.branchId.code})
                    </span>
                  </div>
                )}
              </div>

              <div className="profile-card editable-card">
                <h3 className="card-title">Update Contact Info</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="text"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="street" className="form-label">
                      Street Address
                    </label>
                    <input
                      id="street"
                      type="text"
                      name="address.street"
                      className="form-control"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="e.g. 123 Main St"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="city" className="form-label">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        name="address.city"
                        className="form-control"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group half-width">
                      <label htmlFor="country" className="form-label">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        name="address.country"
                        className="form-control"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-transfer-btn" disabled={saving}>
                    {saving ? 'Saving Changes...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CustomerProfile;