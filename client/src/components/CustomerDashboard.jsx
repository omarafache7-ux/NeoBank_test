import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../context/useAuth';
import '../style/CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <-- comes from login, no fetch needed for THIS

};

export default CustomerDashboard;
