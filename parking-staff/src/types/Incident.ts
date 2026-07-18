export interface Incident {
  id?: string;
  type: string;
  title: string;
  description: string;
  reporter: string;
  role: string;
  createdAt?: string;
}
