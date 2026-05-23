import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { hasActiveSessions } from '../utils/auth';

const PricingPage = () => {
  const navigate = useNavigate();
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  // Real-time Pricing State
  const [prices, setPrices] = useState(() => {
    const saved = localStorage.getItem('parking_pricing');
    return saved ? JSON.parse(saved) : [
      { type: 'Xe máy', price: '5.000', sub: 'VNĐ / Lượt' },
      { type: 'Ô tô 4-7 chỗ', price: '30.000', sub: 'VNĐ / Giờ' },
      { type: 'SUV / Bán tải', price: '50.000', sub: 'VNĐ / Giờ' }
    ];
  });

  // Real-time Regulations State
  const [regulations, setRegulations] = useState(() => {
    const saved = localStorage.getItem('parking_regulations');
    return saved ? JSON.parse(saved) : [
      'Vui lòng đỗ xe đúng vị trí ô đỗ đã đặt trước hoặc quét mã tại chỗ.',
      'Tốc độ di chuyển tối đa trong toàn bộ khuôn viên bãi đỗ xe là 10km/h.',
      'Tuân thủ tuyệt đối chỉ dẫn của nhân viên và biển báo thông minh.',
      'Thực hiện thanh toán trực tuyến qua ứng dụng trước khi ra cổng chắn.',
      'Không chứa các chất dễ cháy nổ, vũ khí hoặc hàng cấm trong phương tiện.',
      'Tự bảo quản tài sản cá nhân có giá trị. Ban quản lý không chịu trách nhiệm mất mát trong xe.'
    ];
  });

  useEffect(() => {
    const savedPrices = localStorage.getItem('parking_pricing');
    if (savedPrices) setPrices(JSON.parse(savedPrices));

    const savedRegs = localStorage.getItem('parking_regulations');
    if (savedRegs) setRegulations(JSON.parse(savedRegs));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <>
      <div className="bg-[#FAFBFD] text-slate-900 antialiased min-h-screen selection:bg-slate-100 font-['Inter'] pb-24">
        <Navbar />

        <main className="pt-40 max-w-6xl mx-auto px-6 relative">
          {/* Subtle Ambient light */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50/40 to-indigo-50/30 rounded-full blur-[120px] -z-10" />

          {/* Minimal Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Dịch vụ & Cấu hình
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight mb-4 leading-tight text-slate-900"
            >
              Bảng giá & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Quy chế vận hành</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-sm font-medium max-w-lg mx-auto"
            >
              Thông tin chi tiết về chính sách giá gửi xe thời gian thực và các điều khoản nội quy đỗ xe áp dụng tại PM System Central Tower.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-12 gap-8 items-start"
          >
            {/* Pricing Card (Left - 5 Cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden">
                <div className="flex items-center gap-4.5 mb-10 pb-6 border-b border-slate-100">
                  <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[20px] font-bold">payments</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-955 tracking-tight leading-none">Bảng giá gửi xe</h3>
                    <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-widest mt-1.5">Áp dụng thời gian thực</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {prices.map((p: any, idx: number) => {
                    let icon = "motorcycle";
                    let iconBg = "bg-blue-50/50 border-blue-100/60 text-blue-600";
                    if (p.type.toLowerCase().includes("ô tô")) {
                      icon = "directions_car";
                      iconBg = "bg-indigo-50/50 border-indigo-100/60 text-indigo-600";
                    } else if (p.type.toLowerCase().includes("suv") || p.type.toLowerCase().includes("bán tải")) {
                      icon = "airport_shuttle";
                      iconBg = "bg-cyan-50/50 border-cyan-100/60 text-cyan-600";
                    }

                    return (
                      <motion.div
                        key={idx}
                        variants={cardVariants}
                        className="flex items-center justify-between p-4.5 rounded-[2rem] border border-slate-100 bg-white hover:bg-slate-50/30 hover:border-blue-100/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full border ${iconBg} flex items-center justify-center shadow-sm shrink-0`}>
                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                          </div>
                          <div className="text-left">
                            <h4 className="text-xs font-bold text-slate-800 tracking-tight">{p.type}</h4>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{p.sub}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-blue-600 tracking-tight">{p.price}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">VND</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-10 space-y-3 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (hasActiveSessions()) {
                        setShowActiveWarning(true);
                      } else {
                        navigate('/reserve');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 px-6 rounded-full text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 group"
                  >
                    <span>Đặt chỗ ngay</span>
                    <span className="material-symbols-outlined text-[12px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-transparent hover:bg-blue-50 border border-blue-200 text-blue-600 font-extrabold py-4 rounded-full text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Quay về Trang chủ
                  </button>
                </div>
              </div>
            </div>

            {/* Regulations Card (Right - 7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] p-8 sm:p-10">
                <div className="flex items-center gap-4.5 mb-10 pb-6 border-b border-slate-100">
                  <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[20px] font-bold">gavel</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-955 tracking-tight leading-none">Nội quy & Quy chế</h3>
                    <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-widest mt-1.5">Yêu cầu tuân thủ an toàn</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {regulations.map((reg: string, i: number) => (
                    <motion.div
                      key={i}
                      variants={cardVariants}
                      className="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100/50 hover:bg-blue-50/5 transition-all duration-200"
                    >
                      <span className="w-6.5 h-6.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                        {i + 1}
                      </span>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed pt-0.5 text-left">
                        {reg}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* ── Active Session Warning Modal ── */}
      <AnimatePresence>
        {showActiveWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden font-['Inter']"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent blur-xl rounded-full" />
              
              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-red-500 font-bold">warning</span>
              </div>
              
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug mb-2">
                Phiên đỗ đang hoạt động
              </h3>
              
              <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-8 px-2">
                Bạn đang có một phiên đỗ xe chưa kết thúc (xe chưa ra khỏi bãi). Vui lòng hoàn tất thanh toán lối ra cho xe hiện tại trước khi thực hiện đặt chỗ mới.
              </p>
              
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/active-session');
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">visibility</span>
                  Xem phiên hiện tại
                </button>
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/reserve', { state: { bypassActiveCheck: true } });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">directions_car</span>
                  Đặt xe khác
                </button>
                <button
                  onClick={() => setShowActiveWarning(false)}
                  className="w-full hover:bg-slate-50 text-slate-400 font-extrabold py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PricingPage;
