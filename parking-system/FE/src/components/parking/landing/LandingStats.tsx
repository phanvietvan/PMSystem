/* ── STATS — dải số liệu ── */
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from './motion';

const STATS = [
  { label: 'Thời gian hoạt động', value: '99.9', unit: '%', color: 'text-emerald-500' },
  { label: 'Vị trí khả dụng', value: '1,248', unit: '', color: 'text-blue-500' },
  { label: 'Thời gian xử lý', value: '4.2', unit: 'ms', color: 'text-indigo-500' },
  { label: 'Điểm dữ liệu', value: '2.5', unit: 'Tr', color: 'text-blue-600' },
];

export default function LandingStats() {
  return (
    <section className="bg-white/20 border-t border-slate-200/40 py-32 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="glass-card p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 group"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 group-hover:text-blue-600 transition-colors">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 tracking-tight">{stat.value}</span>
                {stat.unit && <span className={`${stat.color} font-black text-sm uppercase tracking-widest ml-1`}>{stat.unit}</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
