import { useEffect, useState } from 'react';
import {
  clearSession,
  getStoredUser,
  syncCurrentUserFromApi,
  type StoredUser,
} from '../utils/auth';

/** User hiện tại từ localStorage + sync /auth/me (mọi role). */
export function useCurrentUser() {
  const [user, setUser] = useState<StoredUser | null>(getStoredUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apply = () => setUser(getStoredUser());

    apply();

    if (localStorage.getItem('token')) {
      void syncCurrentUserFromApi().then((fresh) => {
        if (fresh) setUser(fresh);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    window.addEventListener('user-login', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('user-login', apply);
      window.removeEventListener('storage', apply);
    };
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return { user, setUser, ready, logout };
}
