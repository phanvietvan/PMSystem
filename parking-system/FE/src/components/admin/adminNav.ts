import {
  LayoutDashboard,
  CalendarDays,
  Map as MapIcon,
  BarChart3,
  Users,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Reservations', icon: CalendarDays, path: '/admin/reservations' },
  { name: 'Live Monitoring', icon: MapIcon, path: '/admin/monitoring' },
  { name: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { name: 'User Management', icon: Users, path: '/admin/users' },
  { name: 'Blacklist & Notifs', icon: ShieldAlert, path: '/admin/blacklist' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export function isNavActive(pathname: string, path: string): boolean {
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
