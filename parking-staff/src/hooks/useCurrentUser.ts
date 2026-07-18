import { useState, useEffect } from 'react';
import type { User } from '../types/User';
import { authService } from '../services/auth.service';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(authService.getCurrentUser());
    };

    syncUser();
    return authService.subscribeUserEvents(syncUser);
  }, []);

  const logout = () => {
    authService.logout();
  };

  const displayName = authService.getDisplayName(currentUser);

  return {
    currentUser,
    setCurrentUser,
    isDropdownOpen,
    setIsDropdownOpen,
    logout,
    displayName,
  };
};
