import { Bell, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';

export interface NotificationPanelProps {
  role: 'user' | 'admin' | 'staff';
  onClose?: () => void;
}

const NotificationPanel = ({ role }: NotificationPanelProps) => {
  const { notifications, loading, unreadCount, markAllAsRead } = useNotifications({
    enabled: true,
    pollIntervalMs: 5000,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'warning':
        return <ShieldAlert size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-blue-500" />;
    }
  };

  const getBody = (n: {
    message?: string;
    desc?: string;
    title?: string;
  }) => n.message || n.desc || '';

  const getTime = (n: { time?: string; createdAt?: string }) => {
    if (n.time) return n.time;
    if (n.createdAt) {
      try {
        return new Date(n.createdAt).toLocaleString('vi-VN');
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-80 md:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Thông báo</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {role === 'admin' ? 'Quản trị' : 'Tài khoản'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">Chưa có thông báo</div>
        ) : (
          notifications.map((n: {
            id?: string;
            type?: string;
            title?: string;
            message?: string;
            desc?: string;
            time?: string;
            createdAt?: string;
            read?: boolean;
          }) => {
            const body = getBody(n);
            const timeLabel = getTime(n);
            return (
              <div
                key={n.id}
                className={`px-5 py-4 border-b border-slate-50 flex gap-3 ${
                  n.read ? 'opacity-60' : 'bg-blue-50/30'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(n.type || 'info')}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-snug break-words">
                    {n.title || body || 'Thông báo'}
                  </p>
                  {body && n.title && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                      {body}
                    </p>
                  )}
                  {timeLabel && (
                    <p className="text-[10px] font-bold text-slate-400 mt-2">{timeLabel}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel;
