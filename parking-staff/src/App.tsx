import React, { useCallback, useEffect, useState } from 'react';
import HomeDashboard from './pages/HomeDashboard';
import LoginPage from './pages/LoginPage';
import { authService } from './services/auth.service';

const App = () => {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const syncAuth = useCallback(() => {
    // Drop expired JWT so UI returns to login instead of silently 401-ing every call.
    if (authService.getToken() && authService.isTokenExpired()) {
      authService.clearSession();
    }
    const ok =
      authService.isAuthenticated() && authService.canAccessStaffApp(authService.getCurrentUser());
    if (!ok && authService.getToken()) {
      authService.clearSession();
    }
    setAuthenticated(ok);
    setReady(true);
  }, []);

  useEffect(() => {
    syncAuth();
    return authService.subscribeUserEvents(syncAuth);
  }, [syncAuth]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-semibold">
        Đang tải...
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={syncAuth} />;
  }

  return <HomeDashboard />;
};

export default App;
