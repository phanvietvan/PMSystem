import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Info, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const NavigationPage = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  const handleVerifyAtSlot = () => {
    setIsVerified(true);
    setTimeout(() => {
      navigate('/active-session');
    }, 2000);
  };

  return (
    <div className="min-h-screen mesh-bg selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Direction Map */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Navigation className="text-primary w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Chỉ đường tới ô đỗ</h2>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest mt-1">Đang hướng dẫn bạn đến Tầng 03 • Ô A3</p>
                  </div>
                </div>
              </div>

              {/* Simplified Floor Plan with Path */}
              <div className="bg-surface-container rounded-3xl aspect-[16/10] relative overflow-hidden border border-outline-variant/30">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                
                {/* Visual Path Simulation */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
                  <motion.path 
                    d="M 100 400 L 100 200 L 400 200 L 400 120"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeDasharray="10 10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.circle 
                    r="8" fill="#3b82f6"
                    animate={{ cx: [100, 100, 400, 400], cy: [400, 200, 200, 120] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Slot A3 */}
                  <rect x="375" y="70" width="50" height="70" rx="4" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="2" />
                  <text x="400" y="110" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#d97706">A3</text>
                  <MapPin x="388" y="45" width="24" height="24" className="text-amber-500" />
                </svg>

                <div className="absolute bottom-6 left-6 bg-surface-container-lowest px-4 py-3 rounded-2xl border border-outline-variant/30 shadow-lg flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Vị trí hiện tại</p>
                     <p className="text-xs font-bold text-on-surface">Lối vào Tầng 3</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex items-start gap-4">
              <Info className="w-5 h-5 text-primary mt-1" />
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Vui lòng đỗ xe đúng ô **A3**. Sau khi đỗ, hãy quét mã QR được dán trực tiếp tại ô này để bắt đầu phiên giám sát an ninh AI.
              </p>
            </div>
          </div>

          {/* Right: Verification Action */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 text-center">
              <h3 className="text-lg font-bold text-on-surface mb-6">Xác nhận tại chỗ</h3>
              
              <div className="space-y-8">
                <div 
                  onClick={handleVerifyAtSlot}
                  className={`aspect-square w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-500 cursor-pointer group
                    ${isVerified ? 'bg-emerald-50 border-emerald-500' : 'bg-surface-container-low border-outline-variant/30 hover:border-primary'}`}
                >
                  {isVerified ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Đã đỗ đúng vị trí</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-16 h-16 text-on-surface-variant/20 group-hover:text-primary/40" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface">Quét mã tại ô đỗ</p>
                        <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-widest">Chạm để mô phỏng quét</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-left">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">An ninh AI</p>
                      <p className="text-[11px] font-medium text-on-surface-variant leading-tight">Camera AI sẽ tự động kích hoạt giám sát sau khi bạn xác nhận.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default NavigationPage;
