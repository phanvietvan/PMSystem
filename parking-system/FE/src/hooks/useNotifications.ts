import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

type Options = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useNotifications(options: Options = {}) {
  const { enabled = true, pollIntervalMs = 8000 } = options;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await adminService.getNotifications();
      const data = res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      // Normalize API shape so UI always has title / message / time / read
      setNotifications(
        list.map((n: any) => ({
          ...n,
          id: n.id ?? n.Id,
          title: n.title ?? n.Title ?? '',
          message: n.message ?? n.Message ?? n.desc ?? n.Desc ?? '',
          desc: n.desc ?? n.Desc ?? n.message ?? n.Message ?? '',
          time: n.time ?? n.Time ?? '',
          createdAt: n.createdAt ?? n.CreatedAt,
          type: n.type ?? n.Type ?? 'info',
          read: Boolean(n.read ?? n.Read ?? n.isRead ?? n.IsRead),
        })),
      );
      return list;
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

  // Re-fetch when tab becomes visible again (near-realtime)
  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => void fetchNotifications();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, fetchNotifications]);

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
