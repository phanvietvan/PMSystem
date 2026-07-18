import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

type Options = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useNotifications(options: Options = {}) {
  const { enabled = true, pollIntervalMs = 15000 } = options;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await adminService.getNotifications();
      const data = res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void fetchNotifications();
    if (pollIntervalMs <= 0) return;
    const id = setInterval(() => void fetchNotifications(), pollIntervalMs);
    return () => clearInterval(id);
  }, [enabled, pollIntervalMs, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await adminService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const pushNotification = async (body: unknown) => {
    await adminService.pushNotification(body);
    await fetchNotifications();
  };

  return {
    notifications,
    setNotifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    pushNotification,
  };
}
