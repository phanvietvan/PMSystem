import { apiFetch, readErrorMessage } from '../utils/api';
import type { Notification, PushNotificationPayload } from '../types/Notification';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiFetch('/Notifications');
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to fetch notifications'));
    }
    return response.json();
  },

  async pushNotification(payload: PushNotificationPayload): Promise<void> {
    const response = await apiFetch('/Notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to push notification'));
    }
  },
};
