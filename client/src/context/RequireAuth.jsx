import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from 'axios';
import { useEffect, useState } from "react";

const RequireAuth = ({ allowedRole }) => {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {

    const parseJwt = () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          return JSON.parse(atob(token.split(".")[1]));
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    if (!localStorage.getItem('token') || parseJwt().exp * 1000 < Date.now()) {
      setRedirect(true);
    }
  }, []);

  const auth = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (auth && !redirect) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth}`;
  }

  if (!auth || redirect) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;