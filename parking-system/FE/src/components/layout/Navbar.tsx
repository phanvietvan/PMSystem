import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, ChevronDown, Car, AlertTriangle, Bell } from 'lucide-react';
import NotificationPanel from '../common/NotificationPanel';
import BrandLogo from '../brand/BrandLogo';
import api from '../../services/api';
import { isAdmin, syncCurrentUserFromApi, clearSession } from '../../utils/auth';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenUnread, setHasSeenUnread] = useState(true);

  useEffect(() => {
    const applyStoredUser = () => {
      const raw = localStorage.getItem('user');
      setUser(raw ? JSON.parse(raw) : null);
    };

    applyStoredUser();

    if (localStorage.getItem('token')) {
      void syncCurrentUserFromApi(api).then((fresh) => {
        if (fresh) setUser(fresh);
      });
    }

    const handleStorageChange = () => applyStoredUser();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-login', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-login', handleStorageChange);
    };
  }, []);

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

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Trạng thái', path: '/status' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <BrandLogo asLink to="/" size="md" />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-blue-600'}`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth Buttons or User Menu */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-bold text-slate-700 hover:text-blue-600 uppercase tracking-wider px-4 py-2 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-6 rounded-full shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider"
              >
                Đăng ký ngay
              </Link>
            </>
          ) : (
            <>
              {isAdmin(user) && (
                <Link
                  to="/admin"
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all duration-300 font-black text-sm border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  title="Dashboard (Admin)"
                >
                  D
                </Link>
              )}
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
                      <NotificationPanel role="user" onClose={() => setIsNotifOpen(false)} />
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-1.5 pr-4 rounded-full border border-slate-200 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 bg-blue-100 text-blue-600">
                    {user.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : user.email ? (
                      <img 
                        src={`https://unavatar.io/${user.email}?fallback=false`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { 
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          const name = user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.username;
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=DBEAFE&color=2563EB';
                        }}
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">Xin chào,</p>
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.username}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-60 glass-panel rounded-2xl py-2 z-20 origin-top-right shadow-xl shadow-slate-200/40 p-1 flex flex-col gap-0.5 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-slate-100 mb-1.5">
                        <p className="text-xs font-bold text-slate-800 font-display">
                          {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.username}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl"
                      >
                        <User size={15} className="opacity-70" />
                        <span>Thông tin cá nhân</span>
                      </Link>

                      <Link
                        to="/active-session"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl"
                      >
                        <Car size={15} className="opacity-70" />
                        <span>Lịch sử gửi xe</span>
                      </Link>

                      <Link
                        to="/report-incident"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 transition-colors duration-200 rounded-xl"
                      >
                        <AlertTriangle size={15} className="opacity-70 text-rose-500" />
                        <span>Báo cáo sự cố</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/50 transition-colors duration-200 rounded-xl w-full text-left border-t border-slate-100/80 mt-1.5 pt-2"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

