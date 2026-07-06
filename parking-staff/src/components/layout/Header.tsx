import React from 'react';
import { Bell, ChevronDown, AlertTriangle, ExternalLink, LogOut } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import BrandLogo from '../brand/BrandLogo';
import NotificationPanel from '../common/NotificationPanel';

interface HeaderProps {
  currentUser: any;
  displayName: string;
  activeTab: 'home' | 'history';
  navigateTo: (tab: 'home' | 'history') => void;
  handleLogout: () => void;
  unreadCount: number;
  hasSeenUnread: boolean;
  isNotifOpen: boolean;
  setIsNotifOpen: (open: boolean) => void;
  handleOpenNotif: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  setReportLogData: (data: any) => void;
  setReportPlate: (plate: string) => void;
  setReportReason: (reason: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  displayName,
  activeTab,
  navigateTo,
  handleLogout,
  unreadCount,
  hasSeenUnread,
  isNotifOpen,
  setIsNotifOpen,
  handleOpenNotif,
  isDropdownOpen,
  setIsDropdownOpen,
  setShowReportModal,
  setReportLogData,
  setReportPlate,
  setReportReason,
}) => {
  return (
    <header className="shrink-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <BrandLogo size="md" />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <button
            onClick={() => navigateTo('home')}
            className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
            } cursor-pointer`}
          >
            Trang chủ
            {activeTab === 'home' && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => navigateTo('history')}
            className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${
              activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
            } cursor-pointer`}
          >
            Lịch sử
            {activeTab === 'history' && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
          <a
            href="#"
            className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600"
          >
            Liên hệ
          </a>
        </div>

        {/* Auth Buttons or User Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setReportLogData(null);
              setReportPlate('');
              setReportReason('');
              setShowReportModal(true);
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 border border-red-100"
          >
            <AlertTriangle size={14} />
            Báo cáo xe
          </button>
          <a
            href="https://localhost:5173/"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all duration-300 font-black text-sm border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            title="Dashboard (Admin)"
          >
            D
          </a>

          <div className="relative">
            <button
              onClick={handleOpenNotif}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 relative group active:scale-95"
            >
              <Bell
                size={18}
                className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0"
              />
              {unreadCount > 0 && !hasSeenUnread && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-125"></span>
              )}
            </button>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-50">
                  <NotificationPanel role="staff" onClose={() => setIsNotifOpen(false)} />
                </div>
              </>
            )}
          </div>

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-1.5 pr-4 rounded-full border border-slate-200 transition-colors duration-200"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 bg-blue-100 text-blue-600">
                  {currentUser.avatarUrl &&
                  currentUser.avatarUrl !== 'null' &&
                  currentUser.avatarUrl !== 'undefined' ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        displayName
                      )}&background=DBEAFE&color=2563EB`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">
                    Xin chào,
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-3 w-60 glass-panel rounded-2xl py-2 z-20 origin-top-right shadow-xl shadow-slate-200/40 p-1 flex flex-col gap-0.5 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-slate-100 mb-1.5">
                        <p className="text-xs font-bold text-slate-800 font-display">{displayName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                      </div>
                      <a
                        href="https://localhost:5173/"
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl"
                      >
                        <ExternalLink size={15} className="opacity-70" />
                        <span>Về trang chủ</span>
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/50 transition-colors duration-200 rounded-xl w-full text-left border-t border-slate-100/80 mt-1.5 pt-2 cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
