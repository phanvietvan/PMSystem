import { API_BASE_URL } from '../utils/api';
import type { Notification, PushNotificationPayload } from '../types/Notification';
import { authService } from './auth.service';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/Notifications`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  async pushNotification(payload: PushNotificationPayload): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/Notifications/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to push notification');
    }
  }
};
