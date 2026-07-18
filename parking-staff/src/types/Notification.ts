export interface Notification {
  id?: string;
  role: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
}

export interface PushNotificationPayload {
  role: string;
  title: string;
  message: string;
}
