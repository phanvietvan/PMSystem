import { Bell, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationPanelProps {
  role: 'user' | 'admin' | 'staff';
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://localhost:7087/api' // Note: fallback for local dev
  : 'https://pmsystem-oxl8.onrender.com/api');

const NotificationPanel = ({ role, onClose }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/Notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    
    // Polling
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [role]);

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/Notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'warning': return <ShieldAlert size={18} className="text-red-500" />;
      default: return <Bell size={18} className="text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-80 md:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto overscroll-contain custom-scrollbar">
        <AnimatePresence>
          {loading ? (
             <div className="p-8 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-8 text-center flex flex-col items-center gap-3 text-slate-400"
            >
              <Bell size={32} className="text-slate-200" />
              <p className="text-sm font-medium">Bạn chưa có thông báo nào</p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div 
                key={notif.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-4 ${!notif.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  !notif.read ? 'bg-white shadow-sm' : 'bg-slate-100'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className={`text-sm font-semibold ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {notif.desc}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2">
                    {notif.time}
                  </span>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
        <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">
          Xem tất cả
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationPanel;
