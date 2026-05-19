import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, QrCode, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const GateScanPage = () => {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const handleScan = () => {
    setScanStatus('scanning');
    // Simulate API call to verify QR
    setTimeout(() => {
      setScanStatus('success');
      // After success, wait and go to navigation
      setTimeout(() => {
        navigate('/navigation');
      }, 2000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-12 shadow-2xl shadow-primary/5"
        >
          <AnimatePresence mode="wait">
            {scanStatus === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center text-primary">
                  <Scan className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-on-surface mb-3">Xác thực tại cổng</h1>
                  <p className="text-on-surface-variant text-sm font-medium max-w-sm mx-auto">
                    Vui lòng đưa mã QR trong ứng dụng của bạn trước Camera tại cổng để xác nhận quyền vào bãi đỗ.
                  </p>
                </div>

                <div className="relative group cursor-pointer" onClick={handleScan}>
                   <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                   <div className="bg-surface-container-low border-2 border-dashed border-primary/40 rounded-[2.5rem] aspect-square w-64 mx-auto flex items-center justify-center relative overflow-hidden group-hover:border-primary transition-colors">
                      <QrCode className="w-32 h-32 text-on-surface-variant/20 group-hover:text-primary/30 transition-colors" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-primary/0 group-hover:bg-primary/5 transition-colors">
                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Nhấp để mô phỏng quét</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 w-fit mx-auto px-4 py-2 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Hệ thống bảo mật TLS 1.3</span>
                </div>
              </motion.div>
            )}

            {scanStatus === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-8 py-10"
              >
                <div className="relative w-40 h-40 mx-auto">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-2">Đang xác thực...</h2>
                  <p className="text-on-surface-variant text-sm font-medium italic">Đang kiểm tra thông tin đặt chỗ PKI-88902-Z1</p>
                </div>
              </motion.div>
            )}

            {scanStatus === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-10"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-4xl font-display font-black text-emerald-600 mb-2 tracking-tighter">Barrier Đã Mở</h2>
                  <p className="text-on-surface-variant text-sm font-bold">Chào mừng bạn đến với PM System Landmark 81</p>
                </div>
                <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10 text-left space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-outline uppercase tracking-widest">Vị trí đỗ của bạn</span>
                     <span className="text-sm font-black text-primary">Tầng 03 • Ô A3</span>
                   </div>
                   <div className="w-full h-1 bg-outline-variant/10 rounded-full overflow-hidden">
                     <motion.div 
                      initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }}
                      className="h-full bg-emerald-500"
                     />
                   </div>
                   <p className="text-[10px] text-on-surface-variant font-medium text-center italic">Đang tải bản đồ chỉ đường...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default GateScanPage;
