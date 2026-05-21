import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const token = localStorage.getItem('token');
  const allowed = Boolean(user && token);

  useEffect(() => {
    if (!allowed) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [allowed, navigate, location.pathname]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
