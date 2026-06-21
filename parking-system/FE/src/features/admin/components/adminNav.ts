import {
  LayoutDashboard,
  CalendarDays,
  Map as MapIcon,
  Users,
  Settings,
  ShieldAlert,
  AlertTriangle,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  nameKey: string;
  icon: LucideIcon;
  path: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Tổng quan', nameKey: 'adminNavDashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Quản lý giao dịch đặt xe', nameKey: 'adminNavReservations', icon: CalendarDays, path: '/admin/reservations' },
  { name: 'Giám sát trực tiếp', nameKey: 'adminNavMonitoring', icon: MapIcon, path: '/admin/monitoring' },
  { name: 'Quản lý Chi nhánh', nameKey: 'adminNavReports', icon: Building2, path: '/admin/reports' },
  { name: 'Sự cố hệ thống', nameKey: 'adminNavIncidents', icon: AlertTriangle, path: '/admin/incidents' },
  { name: 'Quản lý người dùng', nameKey: 'adminNavUsers', icon: Users, path: '/admin/users' },
  { name: 'Danh sách đen & Cảnh báo', nameKey: 'adminNavBlacklist', icon: ShieldAlert, path: '/admin/blacklist' },
  { name: 'Cài đặt', nameKey: 'adminNavSettings', icon: Settings, path: '/admin/settings' },
];

export function isNavActive(pathname: string, path: string): boolean {
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
