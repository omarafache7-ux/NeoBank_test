import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/SignUp.css'

const initialState = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  // Customer Fields
  nationalId: '',
  dateOfBirth: '',
  phone: '',
  country: '',
  city: '',
  street: '',
  // Employee Fields
  employeeId: '',
  jobTitle: '',
  staffAccessCode: '',
  branchId: '',
  teamId: '',
};

const SignUp = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const [role, setRole] = useState('customer'); 
  const [formData, setFormData] = useState(initialState); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      userName: formData.userName,
      email: formData.email,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
      role,
      ...(role === 'customer'
        ? {
            nationalId: formData.nationalId,
            dateOfBirth: formData.dateOfBirth,
            phone: formData.phone,
            address: {
              country: formData.country,
              city: formData.city,
              street: formData.street,
            },
          }
        : {
            employeeId: formData.employeeId,
            jobTitle: formData.jobTitle,
            staffAccessCode: formData.staffAccessCode,
            branchId: formData.branchId || undefined,
            teamId: formData.teamId || undefined,
          }),
    };

    try {
      const response = await axios.post('http://localhost:4000/api/auth/users/signup', payload);

      const token = response?.data?.token;
      const user = response?.data?.data?.user;
      const nextAuth = {
        ...auth,
        token,
        user,
        userId: user?._id || user?.id,
        role: user?.role || role,
      };

      if (token) {
        setAuth(nextAuth);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSuccess(response?.data?.message || 'Account created successfully!');

      if (role === 'customer') {
        navigate('/customer-dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="card auth-card signup-card">
        <h1>NeoBank Core</h1>
        <p className="subtitle">Create your account</p>

        {/* Role Switcher */}
        <div className="role-selector">
          <button
            type="button"
            className={role === 'customer' ? 'active' : ''}
            onClick={() => setRole('customer')}
          >
            Customer
          </button>
          <button
            type="button"
            className={role === 'employee' ? 'active' : ''}
            onClick={() => setRole('employee')}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Base Account Fields */}
          <div className="form-grid">
            <div className="input-group">
              <label>First Name</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Username</label>
            <input name="userName" value={formData.userName} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required />
            </div>
          </div>

          {/* Conditional Customer Fields */}
          {role === 'customer' && (
            <div className="dynamic-section">
              <h3>Customer Details</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>National ID</label>
                  <input name="nationalId" value={formData.nationalId} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Street</label>
                  <input name="street" value={formData.street} onChange={handleChange} required />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Employee Fields */}
          {role === 'employee' && (
            <div className="dynamic-section">
              <h3>Employee Verification</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Employee ID</label>
                  <input name="employeeId" value={formData.employeeId} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Job Title</label>
                  <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <label>Staff Access Code</label>
                <input type="password" name="staffAccessCode" value={formData.staffAccessCode} onChange={handleChange} required />
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && <p className="alert alert-error">{error}</p>}
          {success && <p className="alert alert-success">{success}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role}`}
          </button>

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;