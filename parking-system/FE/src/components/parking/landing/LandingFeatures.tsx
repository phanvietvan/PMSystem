/* ── FEATURES — 3 công nghệ lõi ── */
import { motion } from 'framer-motion';
import { Cpu, SmartphoneNfc, Zap, QrCode } from 'lucide-react';

const FEATURES = [
  {
    icon: <Cpu className="w-8 h-8 text-indigo-500" />,
    title: 'Nhận diện AI tức thì',
    desc: 'Camera AI tự động đọc biển số xe trong 0.2s, mở barrier tự động không cần lấy vé giấy hay dừng chờ.',
  },
  {
    icon: <QrCode className="w-8 h-8 text-blue-500" />,
    title: 'Bản đồ số Digital Twin',
    desc: 'Giám sát hạ tầng theo thời gian thực. Cập nhật trạng thái từng vị trí đỗ chính xác đến từng giây.',
  },
  {
    icon: <SmartphoneNfc className="w-8 h-8 text-emerald-500" />,
    title: 'Thanh toán không tiền mặt',
    desc: 'Tích hợp VNPay, tự động trừ tiền qua mã QR. Khách hàng dễ dàng xuất bến mà không cần tiền mặt.',
  },
];

export default function LandingFeatures() {
  return (
    <section className="py-32 relative overflow-hidden bg-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 shadow-sm"
          >
            <Zap size={14} className="text-blue-500" /> Công nghệ lõi
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-6"
          >
            Trải nghiệm đỗ xe <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">không chạm</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg font-medium leading-relaxed"
          >
            Hệ thống PM System tích hợp công nghệ AI và IoT tiên tiến nhất, mang đến giải pháp quản lý bãi đỗ xe toàn diện và tự động hóa 100%.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-8 rounded-[2rem] hover:-translate-y-2 transition-all duration-300 border border-slate-100/60 bg-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] group cursor-default"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              >
                {feat.icon}
              </motion.div>
              <h3 className="text-xl font-display font-extrabold text-slate-900 mb-3">{feat.title}</h3>
              <p className="text-slate-500/90 leading-relaxed font-semibold text-sm">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
