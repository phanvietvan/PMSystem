import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { parseLicensePlate, getActiveQrs, removeActiveQr } from '../utils/auth';
import api from '../services/api';
import QRCode from 'qrcode';

interface SessionQrProps {
  qr: string;
}

const SessionQr = ({ qr }: SessionQrProps) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(qr, { width: 250, margin: 1 }, (err, url) => {
      if (!err && url) {
        setQrUrl(url);
      }
    });
  }, [qr]);

  if (!qrUrl) {
    return (
      <div className="w-36 h-36 flex items-center justify-center text-[10px] text-slate-400 font-bold animate-pulse">
        Đang tạo mã QR...
      </div>
    );
  }

  return (
    <img 
      src={qrUrl} 
      alt="Session QR Code" 
      className="w-36 h-36 object-contain animate-fade-in"
    />
  );
};

interface SessionData {
  qr: string;
  licensePlate: string;
  slot: string;
  level: string;
  seconds: number;
  entryTime: string | null;
}

const ActiveSessionPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllActiveSessions = async () => {
      try {
        // Primary: fetch the current user's active session from the server
        const token = localStorage.getItem('token');
        if (token) {
          const resp = await api.get('/ParkingSessions/my-session');
          if (resp.data?.hasActiveSession && resp.data?.session) {
            const s = resp.data.session;
            // Sync the QR to localStorage so checkout flow still works
            if (s.qrCode) {
              const { addActiveQr } = await import('../utils/auth');
              addActiveQr(s.qrCode);
            }
            setSessions([{
              qr: s.qrCode,
              licensePlate: parseLicensePlate(s.licensePlate),
              slot: s.parkingSlot || 'A3',
              level: localStorage.getItem('selectedLevel') || '1',
              seconds: 0,
              entryTime: s.entryTime || s.createdAt || null,
            }]);
            setLoading(false);
            return;
          } else {
            // No active session on server — clear stale localStorage QRs
            localStorage.removeItem('activeSessionQrs');
            setLoading(false);
            navigate('/reserve');
            return;
          }
        }
      } catch (e) {
        // Fall through to localStorage fallback if not logged in or network error
      }

      // Fallback: use QR codes stored in localStorage (anonymous / legacy)
      const qrs = getActiveQrs();
      if (qrs.length === 0) {
        setLoading(false);
        navigate('/reserve');
        return;
      }

      const results: SessionData[] = [];
      for (const qr of qrs) {
        try {
          const resp = await api.get(`/ParkingSessions/verify/${qr}`);
          if (resp.data && resp.data.session) {
            const s = resp.data.session;
            results.push({
              qr,
              licensePlate: parseLicensePlate(s.licensePlate),
              slot: s.parkingSlot || 'A3',
              level: localStorage.getItem('selectedLevel') || '1',
              seconds: 0,
              entryTime: s.entryTime || s.createdAt || null,
            });
          } else {
            removeActiveQr(qr);
          }
        } catch (e) {
          removeActiveQr(qr);
        }
      }

      if (results.length === 0) {
        setLoading(false);
        navigate('/reserve');
        return;
      }

      setSessions(results);
      setLoading(false);
    };

    fetchAllActiveSessions();
  }, []);

  // Timer: update seconds every second based on each session's entryTime
  useEffect(() => {
    if (sessions.length === 0) return;
    const tick = () => {
      setSessions(prev =>
        prev.map(s => {
          if (!s.entryTime) return { ...s, seconds: s.seconds + 1 };
          const diffMs = Date.now() - new Date(s.entryTime).getTime();
          return { ...s, seconds: Math.max(0, Math.floor(diffMs / 1000)) };
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessions.length]);

  // Real-time Status Polling: Automatically end session and redirect when scanned out at exit gate
  useEffect(() => {
    if (sessions.length === 0) return;

    const checkSessionStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const resp = await api.get('/ParkingSessions/my-session');
          if (!resp.data?.hasActiveSession || !resp.data?.session) {
            // The session has been successfully completed in the backend!
            localStorage.removeItem('activeSessionQrs');
            alert("Cảm ơn bạn! Phiên đỗ xe của bạn đã hoàn tất và cổng lối ra đã được mở thành công.");
            navigate('/reserve');
          }
        } else {
          // Check verification for each localStorage QR code
          const qrs = getActiveQrs();
          if (qrs.length === 0) {
            navigate('/reserve');
            return;
          }
          let stillActive = false;
          for (const qr of qrs) {
            try {
              const resp = await api.get(`/ParkingSessions/verify/${qr}`);
              if (resp.data && resp.data.session) {
                stillActive = true;
              } else {
                removeActiveQr(qr);
              }
            } catch {
              removeActiveQr(qr);
            }
          }
          if (!stillActive) {
            alert("Cảm ơn bạn! Phiên đỗ xe của bạn đã hoàn tất và cổng lối ra đã được mở thành công.");
            navigate('/reserve');
          }
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    };

    const intervalId = setInterval(checkSessionStatus, 2000);
    return () => clearInterval(intervalId);
  }, [sessions.length, navigate]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Đang tải phiên đỗ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header badge showing count */}
        {sessions.length > 1 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
              <span className="material-symbols-outlined text-[14px] text-blue-500">garage</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{sessions.length} xe đang gửi</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {sessions.map((session, idx) => (
          <motion.div
            key={session.qr}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-xl shadow-primary/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang giám sát</span>
               </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Zap className="w-5 h-5 fill-primary" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Phiên đỗ {sessions.length > 1 ? `#${idx + 1}` : 'đang hoạt động'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Thời gian đã đỗ</p>
                  <h1 className="text-6xl font-display font-black text-on-surface tracking-tighter tabular-nums">
                    {formatTime(session.seconds)}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-outline-variant/10 py-8">
                 <div>
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Vị trí đỗ</p>
                   <p className="text-xl font-black text-on-surface">Ô {session.slot}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Biển số xe</p>
                   <p className="text-xl font-black text-on-surface tracking-tight">{session.licensePlate}</p>
                 </div>
              </div>

              {/* Exit Verification QR Code Card */}
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 text-center space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-on-surface">Mã QR đỗ xe của bạn</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1">Trình mã này trước máy quét tại cổng ra để đối chiếu & thanh toán</p>
                </div>

                 <div 
                  onClick={() => navigate('/payment', { state: { mode: 'checkout', checkoutQr: session.qr } })}
                  className="relative w-48 h-48 bg-white border border-outline-variant/30 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 cursor-pointer group hover:border-primary hover:shadow-lg transition-all"
                >
                  <SessionQr qr={session.qr} />
                  
                  <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Zap className="w-5 h-5 fill-white" />
                    </div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Giả lập quét lối ra</span>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-outline font-semibold tracking-wider">
                  MÃ SỐ PHIÊN: {session.qr}
                </p>
              </div>

              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                   <ShieldCheck className="text-emerald-500 w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-on-surface">An ninh AI đã kích hoạt</p>
                   <p className="text-[10px] text-on-surface-variant font-medium">Xe của bạn đang được giám sát bởi SecureNode v1.4</p>
                 </div>
              </div>
            </div>
          </motion.div>
          ))}

          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
               <Info className="w-5 h-5" />
             </div>
             <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
               Hệ thống sẽ tự động đối chiếu thời gian ra và vào trên Cơ sở dữ liệu để tính toán chi phí đỗ xe chính xác nhất khi bạn trình mã QR tại cổng ra và hoàn tất quá trình thanh toán thành công.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveSessionPage;
