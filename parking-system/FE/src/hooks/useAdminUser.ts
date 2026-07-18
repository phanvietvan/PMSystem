import { useEffect, useState } from 'react';
import { getStoredUser, syncCurrentUserFromApi, type StoredUser } from '../utils/auth';

export function useAdminUser() {
  const [user, setUser] = useState<StoredUser | null>(getStoredUser);

  useEffect(() => {
    const apply = () => setUser(getStoredUser());
    apply();

    if (localStorage.getItem('token')) {
      void syncCurrentUserFromApi().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    }

    window.addEventListener('user-login', apply);
    return () => window.removeEventListener('user-login', apply);
  }, []);

  return user;
}
