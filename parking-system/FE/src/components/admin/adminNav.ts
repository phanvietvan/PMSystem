import {
  LayoutDashboard,
  CalendarDays,
  Map as MapIcon,
  BarChart3,
  Users,
  Settings,
  ShieldAlert,
  AlertTriangle,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Tổng quan', icon: LayoutDashboard, path: '/admin' },
  { name: 'Quản lý giao dịch đặt xe', icon: CalendarDays, path: '/admin/reservations' },
  { name: 'Giám sát trực tiếp', icon: MapIcon, path: '/admin/monitoring' },
  { name: 'Quản lý Chi nhánh', icon: Building2, path: '/admin/reports' },
  { name: 'Sự cố hệ thống', icon: AlertTriangle, path: '/admin/incidents' },
  { name: 'Quản lý người dùng', icon: Users, path: '/admin/users' },
  { name: 'Danh sách đen & Cảnh báo', icon: ShieldAlert, path: '/admin/blacklist' },
  { name: 'Cài đặt', icon: Settings, path: '/admin/settings' },
];

export function isNavActive(pathname: string, path: string): boolean {
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
