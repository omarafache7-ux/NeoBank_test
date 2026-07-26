import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/Login.css'

const Login = () => {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
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

    try {
      const response = await axios.post('http://localhost:4000/api/auth/users/login', {
        email: formData.email,
        password: formData.password,
      });

      const token = response?.data?.token;
      const user = response?.data?.data?.user;
      const nextAuth = { 
     ...auth, 
      token, 
      user,
      userId: user?._id || user?.id, // Extracting the userId
      role: user?.role               // Extracting the role
      };
      if (token) {
        setAuth(nextAuth);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      setSuccess(response?.data?.message || 'Login successful');

      if (user?.role === 'customer') {
        navigate('/customer-dashboard');
      }
      else if(user?.role==='employee'){
        navigate('/admin-users')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="card auth-card">
        <h1>NeoBank Core</h1>
        <p>Sign in to your secure banking workspace.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="alert alert-error">{error}</p> : null}
          {success ? <p className="alert alert-success">{success}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p>
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
