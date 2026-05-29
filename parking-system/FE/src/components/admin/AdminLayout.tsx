import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, Search, MonitorSmartphone, ExternalLink, Bell } from 'lucide-react';
import NotificationPanel from '../common/NotificationPanel';
import BrandLogo from '../brand/BrandLogo';
import { useAdminUser } from '../../hooks/useAdminUser';
import api from '../../services/api';
import {
  clearSession,
  getRoleLabel,
  getUserDisplayName,
  getUserInitials,
} from '../../utils/auth';
import { ADMIN_NAV, isNavActive } from './adminNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchClassName?: string;
  headerActions?: React.ReactNode;
}

const AdminLayout = ({
  children,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchValue,
  onSearchChange,
  searchClassName = 'w-64',
  headerActions,
}: AdminLayoutProps) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenUnread, setHasSeenUnread] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAdminUser();

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/Notifications');
        const count = res.data.filter((n: any) => !n.read).length;
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const lastSeen = Number(localStorage.getItem(`lastSeenNotifCount_${user.id}`) || '0');
    if (unreadCount > lastSeen) {
       setHasSeenUnread(false);
    } else {
       setHasSeenUnread(true);
    }
  }, [unreadCount, user]);

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && user) {
      setHasSeenUnread(true);
      localStorage.setItem(`lastSeenNotifCount_${user.id}`, unreadCount.toString());
    }
  };

  const displayName = getUserDisplayName(user);
  const roleLabel = getRoleLabel(user);
  const initials = getUserInitials(user);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex font-['Plus_Jakarta_Sans',sans-serif]">
      <aside className="hidden md:flex flex-col h-screen py-8 sticky left-0 top-0 bg-white border-r border-slate-200 w-[280px] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="px-8 mb-10">
          <BrandLogo asLink size="sm" showTagline tagline="Trung tâm Điều khiển" />
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {ADMIN_NAV.map((link) => {
            const active = isNavActive(location.pathname, link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 group ${
                  active
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-600/5'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <link.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    active ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span className={`text-sm ${active ? 'font-bold' : 'font-semibold'}`}>{link.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-2 pb-1">
            <div className="h-px w-full bg-slate-100"></div>
          </div>
          
          <a
            href="/parkingstaff/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 group text-emerald-600 hover:bg-emerald-50 shadow-sm border border-emerald-100"
          >
            <MonitorSmartphone className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-sm font-bold flex-1">Cổng Staff (Máy quét)</span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>
        </nav>

        <div className="px-4 mt-auto space-y-6">
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-xs font-bold text-blue-900 mb-1">PM System</p>
            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
              {roleLabel} · {displayName}
            </p>
          </div>

          <div className="space-y-1">
            <Link
              to="/contact"
              className="flex items-center gap-3 px-5 py-3 text-slate-500 text-sm hover:text-blue-600 transition-colors font-bold group"
            >
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              <span>Trung tâm Trợ giúp</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-5 py-3 text-red-500 text-sm hover:text-red-600 transition-colors font-bold group w-full text-left"
            >
              <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb]">
        <header className="flex justify-between items-center h-20 px-10 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div
            className={`flex items-center gap-4 bg-slate-100/80 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all ${onSearchChange ? 'w-80' : ''}`}
          >
            <Search className="text-slate-400 w-4.5 h-4.5 shrink-0" />
            <input
              className={`bg-transparent border-none focus:ring-0 text-sm text-slate-900 p-0 placeholder:text-slate-400 ${onSearchChange ? 'w-full' : searchClassName}`}
              placeholder={searchPlaceholder}
              type="text"
              value={searchValue}
              onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
              readOnly={!onSearchChange && searchValue === undefined}
            />
          </div>

          <div className="flex items-center gap-5">
            {headerActions}
            <Link
              to="/"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all duration-300 font-black text-sm border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="Quay lại trang chủ"
            >
              W
            </Link>
            <div className="relative">
              <button 
                onClick={handleOpenNotif}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 relative group active:scale-95"
              >
                <Bell size={18} className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0" />
                {unreadCount > 0 && !hasSeenUnread && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-125"></span>
                )}
              </button>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-12 z-50">
                    <NotificationPanel role="admin" onClose={() => setIsNotifOpen(false)} />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-2 rounded-full border border-slate-200">
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 bg-blue-600 text-white text-xs font-black shrink-0">
                {user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block text-left max-w-[140px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5 truncate">
                  {roleLabel}
                </p>
                <p className="text-xs font-bold text-slate-900 leading-none truncate" title={displayName}>
                  {displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 p-2 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-full transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
