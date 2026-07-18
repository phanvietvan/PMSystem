/* ── CTA — khối kêu gọi đặt chỗ ── */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { hasActiveSessions } from '../../../utils/auth';

type Props = {
  onNeedActiveWarning: () => void;
};

export default function LandingCta({ onNeedActiveWarning }: Props) {
  const navigate = useNavigate();

  return (
    <section className="py-32 relative overflow-hidden bg-white/70 border-t border-slate-200/40 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white/80 to-white pointer-events-none"></div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="w-[800px] h-[800px] bg-gradient-to-tr from-blue-400/20 to-indigo-400/15 blur-[100px] rounded-[40%_60%_70%_30%]"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-[56px] leading-[1.1] font-black text-slate-900 mb-8 tracking-tight font-display"
        >
          Sẵn sàng trải nghiệm bãi đỗ xe của{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">tương lai?</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium"
        >
          Hàng ngàn khách hàng đã chuyển sang hệ thống quản lý thông minh. Tham gia mạng lưới của chúng tôi ngay hôm nay.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => {
              if (hasActiveSessions()) onNeedActiveWarning();
              else navigate('/reserve');
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-300 font-extrabold py-5 px-12 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/25 cursor-pointer relative overflow-hidden group"
          >
            <span className="relative z-10">Bắt đầu Đặt chỗ</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
