import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, LogOut, Info, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const ActiveSessionPage = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedFee = Math.max(10000, Math.floor(seconds / 60) * 500 + 10000);

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Session Info */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
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
                    <span className="text-xs font-black uppercase tracking-widest">Phiên đỗ đang hoạt động</span>
                  </div>
                  <h1 className="text-6xl font-display font-black text-on-surface tracking-tighter tabular-nums">
                    {formatTime(seconds)}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-outline-variant/10 py-8">
                   <div>
                     <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Vị trí đỗ</p>
                     <p className="text-xl font-black text-on-surface">Tầng 03 • A3</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Biển số xe</p>
                     <p className="text-xl font-black text-on-surface tracking-tight">51F-123.45</p>
                   </div>
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

            <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                 <Info className="w-5 h-5" />
               </div>
               <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                 Hệ thống sẽ tự động trừ phí khi bạn rời bãi đỗ. Nếu bạn muốn thanh toán thủ công ngay bây giờ, hãy nhấn vào nút <b>Kết thúc phiên</b>.
               </p>
            </div>
          </div>

          {/* Right: Checkout Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5"
            >
              <div className="flex items-center gap-3 mb-8">
                <CreditCard className="text-primary w-5 h-5" />
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Thanh toán dự tính</h3>
              </div>

              <div className="space-y-6 mb-10">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-outline uppercase tracking-widest">Phí hiện tại</span>
                    <span className="text-3xl font-display font-black text-primary tabular-nums">{estimatedFee.toLocaleString()} VNĐ</span>
                 </div>
                 <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-on-surface-variant">Phí gốc (1h đầu)</span>
                      <span className="text-on-surface">10.000 VNĐ</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-on-surface-variant">Phí phát sinh</span>
                      <span className="text-on-surface">{(estimatedFee - 10000).toLocaleString()} VNĐ</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => navigate('/payment')}
                className="w-full bg-on-surface text-surface font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <LogOut className="w-5 h-5" />
                Kết thúc phiên đỗ
              </button>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ActiveSessionPage;
