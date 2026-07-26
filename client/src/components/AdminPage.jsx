import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/AdminUsers.css';

const API_BASE_URL = 'http://localhost:4000/api';

function AdminUsers() {
  const { auth } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals & Selection
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  // Form Initial States
  const initialFormState = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    role: 'customer',
    status: 'active',
  };

  const [formData, setFormData] = useState(initialFormState);

  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer',
    status: 'active',
  });

  // Dynamic Auth Headers
  const getHeaders = useCallback(() => {
    const currentToken = auth?.token || localStorage.getItem('token');
    return {
      headers: {
        Authorization: currentToken ? `Bearer ${currentToken}` : '',
      },
    };
  }, [auth?.token]);

  // Fetch Users — Pointing to /api/auth/get-Allusers based on your authrouter
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const currentToken = auth?.token || localStorage.getItem('token');
      if (!currentToken) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      // Route matches index.js (/api/auth) + authrouter (/get-Allusers)
      const response = await axios.get(`${API_BASE_URL}/auth/get-Allusers`, getHeaders());
      
      const rawData = response.data;
      const data = Array.isArray(rawData) 
        ? rawData 
        : rawData?.data || rawData?.users || [];

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch users error:', err?.response || err);
      setError(err?.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  }, [auth?.token, getHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Create User — Route points to signup endpoint or employee creation depending on role
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (formData.role === 'customer') {
        await axios.post(`${API_BASE_URL}/customers/create-customers`, formData, getHeaders());
      } else if (formData.role === 'employee') {
        await axios.post(`${API_BASE_URL}/employees/create-employees`, formData, getHeaders());
      } else {
        await axios.post(`${API_BASE_URL}/auth/users/signup`, formData, getHeaders());
      }

      setSuccessMsg('User successfully created!');
      setShowCreateModal(false);
      setFormData(initialFormState);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user.');
    }
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setEditUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'customer',
      status: user.status || 'active',
    });
  };

  // Update User — Routes based on role to match customer/employee routes
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const targetId = editUser._id || editUser.id;
      if (editUser.role === 'employee') {
        await axios.put(`${API_BASE_URL}/employees/update-employees/${targetId}`, editFormData, getHeaders());
      } else {
        await axios.put(`${API_BASE_URL}/customers/update-customers/${targetId}`, editFormData, getHeaders());
      }

      setSuccessMsg('User successfully updated!');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user.');
    }
  };

  // Delete User — Route matches employee router endpoint
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    setSuccessMsg('');

    try {
      await axios.delete(`${API_BASE_URL}/employees/delete-employees/${userId}`, getHeaders());
      setSuccessMsg('User successfully deleted.');
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const userName = (u.userName || u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    const matchesQuery =
      fullName.includes(query) || userName.includes(query) || email.includes(query);
    const matchesRole = roleFilter === 'all' || (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());

    return matchesQuery && matchesRole;
  });

  return (
    <div className="admin-users-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2>System User Management</h2>
          <p className="subtitle">
            Manage system login accounts, user roles, and account statuses.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create New User
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Toolbar */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <div className="stats-badge">
          Total Users: <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-state">Loading user records...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  return (
                    <tr key={id}>
                      <td>
                        <strong>
                          {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'N/A'}
                        </strong>
                      </td>
                      <td>{u.userName || u.username || '—'}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.status || 'active'}`}>{u.status || 'active'}</span>
                      </td>
                      <td>
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="actions-cell">
                        <button className="btn-action view" onClick={() => setViewUser(u)}>
                          View
                        </button>
                        <button className="btn-action edit" onClick={() => openEditModal(u)}>
                          Edit
                        </button>
                        <button className="btn-action delete" onClick={() => handleDeleteUser(id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No users matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Create User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="userName"
                    required
                    value={formData.userName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength="80"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Edit User: {editUser.userName || editUser.username || editUser.email}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    maxLength="80"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Account Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>User Profile Overview</h3>
            <div className="view-details-grid">
              <div>
                <strong>User ID:</strong> <small>{viewUser._id || viewUser.id}</small>
              </div>
              <div>
                <strong>Full Name:</strong> {viewUser.firstName} {viewUser.lastName}
              </div>
              <div>
                <strong>Username:</strong> {viewUser.userName || viewUser.username || '—'}
              </div>
              <div>
                <strong>Email:</strong> {viewUser.email}
              </div>
              <div>
                <strong>Assigned Role:</strong> {viewUser.role}
              </div>
              <div>
                <strong>Account Status:</strong> {viewUser.status || 'active'}
              </div>
              <div>
                <strong>Last Login:</strong>{' '}
                {viewUser.lastLoginAt
                  ? new Date(viewUser.lastLoginAt).toLocaleString()
                  : 'No login recorded'}
              </div>
              <div>
                <strong>Created At:</strong>{' '}
                {viewUser.createdAt
                  ? new Date(viewUser.createdAt).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;