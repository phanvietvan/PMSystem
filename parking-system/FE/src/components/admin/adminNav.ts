import {
  LayoutDashboard,
  CalendarDays,
  Map as MapIcon,
  BarChart3,
  Users,
  Settings,
  ShieldAlert,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Tổng quan', icon: LayoutDashboard, path: '/admin' },
  { name: 'Đặt chỗ', icon: CalendarDays, path: '/admin/reservations' },
  { name: 'Giám sát trực tiếp', icon: MapIcon, path: '/admin/monitoring' },
  { name: 'Báo cáo', icon: BarChart3, path: '/admin/reports' },
  { name: 'Sự cố hệ thống', icon: AlertTriangle, path: '/admin/incidents' },
  { name: 'Quản lý người dùng', icon: Users, path: '/admin/users' },
  { name: 'Danh sách đen & Cảnh báo', icon: ShieldAlert, path: '/admin/blacklist' },
  { name: 'Cài đặt', icon: Settings, path: '/admin/settings' },
];

export function isNavActive(pathname: string, path: string): boolean {
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
