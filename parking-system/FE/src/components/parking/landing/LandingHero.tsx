/* ── HERO — tiêu đề + nút CTA + mockup Lottie ── */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLottie } from 'lottie-react';
import animationData from '../../ui/hasahar.json';
import { hasActiveSessions } from '../../../utils/auth';
import { containerVariants, itemVariants, floatingVariants } from './motion';

type Props = {
  onNeedActiveWarning: () => void;
};

export default function LandingHero({ onNeedActiveWarning }: Props) {
  const navigate = useNavigate();
  const { View: LottieView } = useLottie({ animationData, loop: true });

  const goReserve = () => {
    if (hasActiveSessions()) onNeedActiveWarning();
    else navigate('/reserve');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-10"
        >
          <motion.h1 variants={itemVariants} className="text-6xl lg:text-[84px] font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 leading-[1.05] tracking-[-0.04em]">
            Hệ thống <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">Quản lý Đỗ xe</span> <br />
            Thông minh
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-500/80 leading-relaxed max-w-lg font-medium">
            Thế hệ quản lý hạ tầng tiếp theo. Trải nghiệm sự liền mạch và tối ưu hóa không gian được dẫn dắt bởi trí tuệ nhân tạo kiến trúc.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 pt-4">
            <button
              onClick={goReserve}
              className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-10 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden cursor-pointer"
            >
              <span className="relative z-10">Đặt chỗ ngay</span>
              <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-white/60 hover:bg-white text-blue-600 font-bold py-5 px-10 rounded-full border border-blue-100 backdrop-blur-sm transition-all duration-300 flex items-center justify-center hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              Xem Bảng giá
            </button>
          </motion.div>
        </motion.div>

        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[120px] rounded-full"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="glass-card glow-border p-3 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]"
            >
              <div className="bg-white/80 rounded-[2.2rem] overflow-hidden border border-white/40 shadow-inner">
                <div className="px-8 py-5 bg-white/40 border-b border-slate-100/50 flex items-center justify-between">
                  <div className="flex gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm"></div>
                  </div>
                  <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                </div>

                <div className="p-8">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-50/50 shadow-2xl shadow-inner-lg group">
                    <div className="w-full h-full transform group-hover:scale-[1.02] transition-transform duration-700">
                      {LottieView}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                  </div>

                  <div className="mt-8 glass-card p-6 rounded-[2rem] border border-white/60 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Tỉ lệ lấp đầy</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">88.4%</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md uppercase tracking-wider">Tối ưu</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 max-w-[140px] ml-6">
                      <div className="w-full h-3 bg-slate-100/80 rounded-full overflow-hidden relative border border-slate-200/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '88.4%' }}
                          transition={{ duration: 2, delay: 0.8 }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
