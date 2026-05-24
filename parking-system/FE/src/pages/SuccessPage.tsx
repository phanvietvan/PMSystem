import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, Share2, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { parseLicensePlate } from '../utils/auth';
import api from '../services/api';
import QRCode from 'qrcode';

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';
  const qrCode = location.state?.qrCode || '';
  const [status, setStatus] = useState<'qr' | 'opening'>(mode === 'checkout' ? 'opening' : 'qr');
  const [licensePlate, setLicensePlate] = useState('51F-123.45');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  
  let parkingInfo = { name: "Landmark 81 - Bãi đỗ A1", floor: "Tầng 1", block: "Block A" };
  try {
    const raw = localStorage.getItem('selectedParking');
    if (raw) parkingInfo = JSON.parse(raw);
  } catch(e) {}

  let displayFloor = parkingInfo.floor;
  if (selectedSlot && selectedSlot !== 'Auto') {
    const prefix = selectedSlot.charAt(0).toUpperCase();
    if (prefix === 'A' || prefix === 'B') displayFloor = 'Tầng 1';
    else if (prefix === 'C' || prefix === 'D') displayFloor = 'Tầng 2';
    else if (prefix === 'E' || prefix === 'F') displayFloor = 'Tầng 3';
  }

  const resDate = localStorage.getItem('reservationDate') ? new Date(localStorage.getItem('reservationDate')!).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
  const resTime = localStorage.getItem('reservationStartTime') || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, { width: 300, margin: 1 }, (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      });
    }
  }, [qrCode]);

  useEffect(() => {
    // Sync license plate
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.licensePlate) {
          setLicensePlate(parseLicensePlate(user.licensePlate));
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (mode === 'checkout') {
      // Exit/Checkout Flow: Show barrier opening animation then redirect home
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Reservation/Entry Flow: Poll BE to see if staff scanned QR code
      if (!qrCode) {
        // Fallback if no QR code in state: simulate scan after 12 seconds so the app is not stuck in dev/testing
        const timer = setTimeout(() => {
          setStatus('opening');
          const navTimer = setTimeout(() => {
            navigate('/navigation');
          }, 4000);
          return () => clearTimeout(navTimer);
        }, 12000);
        return () => clearTimeout(timer);
      }

      // Real-time polling
      let isCleared = false;
      const pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/ParkingSessions/verify/${qrCode}`);
          if (res.data && res.data.session && res.data.session.isCheckedIn) {
            clearInterval(pollInterval);
            isCleared = true;
            setStatus('opening');
            
            setTimeout(() => {
              navigate('/navigation');
            }, 4000);
          }
        } catch (err) {
          console.error('Error polling session status', err);
        }
      }, 2000);

      return () => {
        if (!isCleared) clearInterval(pollInterval);
      };
    }
  }, [navigate, mode, qrCode]);

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          {status === 'qr' ? (
            <motion.div 
              key="qr-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-2xl shadow-primary/5 text-center relative overflow-hidden"
            >
              {/* Success Header */}
              <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="text-white w-10 h-10" />
              </div>
              <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Đặt chỗ thành công!</h1>
              <p className="text-on-surface-variant text-sm font-medium mb-10 italic">Mã đơn hàng: #PKI-88902-Z1</p>

              {/* QR Code Container */}
              <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/20 relative mb-10 group">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem] pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Biển số: {licensePlate}</span>
                </div>
                 {/* Real Scannable QR Code Image */}
                <div className="mx-auto w-[200px] h-[200px] bg-white p-3 rounded-3xl border border-outline-variant/10 shadow-inner flex items-center justify-center">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Real Scannable QR Code"
                      className="w-full h-full object-contain select-none"
                    />
                  ) : (
                    <div className="text-xs text-outline font-bold animate-pulse">
                      Đang tạo mã quét...
                    </div>
                  )}
                </div>
                <div className="mt-6 flex flex-col items-center">
                  <span className="text-[8px] font-black text-outline uppercase tracking-[0.25em] mb-1">MÃ QUÉT CỦA BẠN</span>
                  <span className="text-sm font-extrabold text-primary font-mono select-all bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 tracking-widest">{qrCode || 'QR_NO_CODE'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Vị trí</span>
                  <p className="text-[13px] font-black text-on-surface leading-tight truncate" title={parkingInfo.name}>{parkingInfo.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold mt-0.5">{displayFloor} • Slot {selectedSlot}</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Thời gian</span>
                  <p className="text-[13px] font-black text-on-surface leading-tight truncate">{resDate}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold mt-0.5">{resTime}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                  <Download className="w-4 h-4" />
                  Lưu mã QR về điện thoại
                </button>
                <button className="w-full bg-surface-container hover:bg-surface-container-high font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs">
                  <Share2 className="w-4 h-4" /> Chia sẻ mã QR
                </button>
              </div>

              <div className="mt-10 flex items-start gap-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Đang chờ Staff quét mã...</span>
                  </div>
                  <p className="text-[10px] text-primary/60 font-medium text-left leading-relaxed italic">
                    Vui lòng dơ mã QR này trước Camera của nhân viên. Hệ thống sẽ tự động chuyển hướng khi xác thực thành công.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="opening-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-12 shadow-2xl text-center relative overflow-hidden"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-8 shadow-xl shadow-blue-600/30"
              >
                <ShieldCheck className="text-white w-12 h-12" />
              </motion.div>
              
              <h1 className="text-3xl font-display font-black text-on-surface mb-4">
                {mode === 'checkout' ? 'Thanh toán thành công!' : 'Xác thực thành công!'}
              </h1>
              <p className="text-slate-500 font-medium mb-12">
                {mode === 'checkout' 
                  ? 'Hệ thống đã xác nhận thanh toán phí đỗ xe. Barrier lối ra đang mở...' 
                  : 'Hệ thống Staff đã xác nhận thông tin đặt chỗ. Đang mở Barrier lối vào...'}
              </p>

              {/* Barrier Animation Mockup */}
              <div className="relative w-full h-48 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                <div className="absolute bottom-10 left-10 w-4 h-20 bg-slate-800 rounded-full"></div>
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: -70 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="absolute bottom-24 left-10 w-64 h-3 bg-red-500 rounded-full origin-left flex justify-around items-center px-4"
                >
                  <div className="w-8 h-1.5 bg-white/40 rounded-full"></div>
                  <div className="w-8 h-1.5 bg-white/40 rounded-full"></div>
                  <div className="w-8 h-1.5 bg-white/40 rounded-full"></div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="absolute inset-0 bg-blue-600/5 flex flex-col items-center justify-center"
                >
                  <div className="px-6 py-2 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg">
                    {mode === 'checkout' ? 'EXIT BARRIER OPENED' : 'BARRIER OPENED'}
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                    {mode === 'checkout' ? 'Chúc quý khách thượng lộ bình an!' : 'Vui lòng di chuyển vào bãi...'}
                  </p>
                </motion.div>
              </div>

              <div className="mt-12 flex items-center justify-center gap-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {mode === 'checkout' ? 'Đang chuyển hướng về Trang chủ...' : 'Đang chuyển hướng tới bản đồ...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SuccessPage;

