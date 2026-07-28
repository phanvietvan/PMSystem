export interface Incident {
  id?: string;
  type: string;
  title: string;
  description: string;
  userId?: string | null;
  reporter?: string;
  role?: string;
  createdAt?: string;
}
