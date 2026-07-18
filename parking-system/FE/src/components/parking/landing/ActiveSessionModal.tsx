/* ── MODAL — cảnh báo đang có phiên gửi xe ── */
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ActiveSessionModal({ open, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
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
            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent blur-xl rounded-full" />

            <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-3xl text-red-500 font-bold">warning</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-2">
              Phiên đỗ đang hoạt động
            </h3>

            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 px-2">
              Bạn đang có một phiên đỗ xe chưa kết thúc (xe chưa ra khỏi bãi). Vui lòng hoàn tất thanh toán lối ra cho xe hiện tại trước khi thực hiện đặt chỗ mới.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => {
                  onClose();
                  navigate('/active-session');
                }}
                className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                Xem phiên đỗ hiện tại
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/reserve', { state: { bypassActiveCheck: true } });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">directions_car</span>
                Đặt chỗ cho xe khác
              </button>
              <button
                onClick={onClose}
                className="w-full hover:bg-slate-50 text-slate-500 font-extrabold py-3 rounded-full text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
