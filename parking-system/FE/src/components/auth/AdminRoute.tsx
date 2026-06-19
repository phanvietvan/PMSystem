import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, isAdmin } from '../../utils/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const allowed = Boolean(user && isAdmin(user));

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }
    if (!isAdmin(user)) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, location.pathname]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
