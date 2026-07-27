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
 


  const initialFormState = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    role: 'customer',
    status: 'active',
  };



  const getHeaders = useCallback(() => {
    const currentToken = auth?.token || localStorage.getItem('token');
    return {
      headers: {
        Authorization: currentToken ? `Bearer ${currentToken}` : '',
      },
    };
  }, [auth?.token]);

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

 
 


   fetchUsers();

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
      </div>


  );
}

export default AdminUsers;