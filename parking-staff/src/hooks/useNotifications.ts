import { useState, useEffect } from 'react';
import type { User } from '../types/User';
import { notificationService } from '../services/notification.service';

export const useNotifications = (currentUser: User | null) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenUnread, setHasSeenUnread] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const data = await notificationService.getNotifications();
        const count = data.filter((n) => !n.read).length;
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.email || 'staff';
    const lastSeen = Number(localStorage.getItem(`lastSeenNotifCount_${userId}`) || '0');
    if (unreadCount > lastSeen) {
      setHasSeenUnread(false);
    } else {
      setHasSeenUnread(true);
    }
  }, [unreadCount, currentUser]);

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && currentUser) {
      setHasSeenUnread(true);
      const userId = currentUser.id || currentUser.email || 'staff';
      localStorage.setItem(`lastSeenNotifCount_${userId}`, unreadCount.toString());
    }
  };

  return {
    isNotifOpen,
    setIsNotifOpen,
    unreadCount,
    hasSeenUnread,
    handleOpenNotif,
  };
};
