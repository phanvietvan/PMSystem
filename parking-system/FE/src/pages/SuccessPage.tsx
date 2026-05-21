import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, Share2, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { parseLicensePlate } from '../utils/auth';

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';
  const [status, setStatus] = useState<'qr' | 'opening'>(mode === 'checkout' ? 'opening' : 'qr');
  const [licensePlate, setLicensePlate] = useState('51F-123.45');

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  const selectedLevel = localStorage.getItem('selectedLevel') || '3';

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
      // Reservation/Entry Flow: Show QR, simulate staff scanning, then show barrier opening and navigate to map
      const timer = setTimeout(() => {
        setStatus('opening');
        
        const navTimer = setTimeout(() => {
          navigate('/navigation');
        }, 4000);
        
        return () => clearTimeout(navTimer);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [navigate, mode]);

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
                {/* Mock QR SVG */}
                <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="200" fill="transparent"/>
                  <path d="M20 20h60v60h-60zM120 20h60v60h-60zM20 120h60v60h-60z" fill="#000" fillOpacity="0.9"/>
                  <path d="M40 40h20v20h-20zM140 40h20v20h-20zM40 140h20v20h-20z" fill="#fff"/>
                  <rect x="90" y="20" width="20" height="20" fill="#000"/>
                  <rect x="90" y="50" width="10" height="30" fill="#000"/>
                  <rect x="20" y="90" width="30" height="10" fill="#000"/>
                  <rect x="60" y="90" width="80" height="20" fill="#000"/>
                  <rect x="150" y="90" width="30" height="10" fill="#000"/>
                  <rect x="90" y="120" width="20" height="60" fill="#000"/>
                  <rect x="120" y="120" width="60" height="60" fill="#000"/>
                  <rect x="130" y="130" width="40" height="40" fill="#fff"/>
                  <rect x="145" y="145" width="10" height="10" fill="#000"/>
                </svg>
                <p className="mt-6 text-[10px] font-black text-outline uppercase tracking-[0.3em]">Mã định danh duy nhất</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Vị trí</span>
                  <p className="text-sm font-black text-on-surface">Tầng {selectedLevel.padStart(2, '0')} • {selectedSlot}</p>
                </div>
                <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Thời gian</span>
                  <p className="text-sm font-black text-on-surface">08:30 AM</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                  <Download className="w-4 h-4" />
                  Lưu mã QR về điện thoại
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 bg-surface-container hover:bg-surface-container-high font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs">
                    <Share2 className="w-4 h-4" /> Chia sẻ
                  </button>
                  <Link to="/gate-scan" className="flex-1 bg-primary text-on-primary font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-primary/20">
                    Tới cổng bãi đỗ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
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

