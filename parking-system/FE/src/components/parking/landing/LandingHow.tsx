/* ── HOW — 3 bước quy trình ── */
import { motion } from 'framer-motion';

const STEPS = [
  { step: '01', title: 'Đặt chỗ trước', desc: 'Chọn bãi đỗ và vị trí thông qua bản đồ trực tuyến ngay trên điện thoại.' },
  { step: '02', title: 'Quét & Nhận diện', desc: 'Hệ thống Camera AI tại cổng sẽ tự động nhận diện biển số và cấp quyền truy cập.' },
  { step: '03', title: 'Tự động thanh toán', desc: 'Khi xe ra, hệ thống tự đối soát thời gian và trừ tiền tự động.' },
];

export default function LandingHow() {
  return (
    <section className="py-32 bg-white/40 border-t border-slate-200/40 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-6"
          >
            Quy trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">tối giản</span>
          </motion.h2>
          <p className="text-slate-500 text-lg font-medium">
            Chỉ với 3 bước đơn giản, mọi thủ tục gửi xe của bạn sẽ được hoàn tất hoàn toàn tự động.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-slate-100 overflow-hidden rounded-full">
            <motion.div
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {STEPS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative text-center group"
            >
              <div className="relative w-24 h-24 mx-auto mb-8 z-10">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400/40"
                  animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] group-hover:border-blue-200 group-hover:shadow-blue-500/20 group-hover:scale-110 transition-all duration-500 bg-clip-padding">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 font-display">{item.step}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed px-4 text-sm font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
