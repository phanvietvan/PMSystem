import React from 'react';
import { AnimatePresence } from 'framer-motion';

interface GlobalAlertProps {
  alertMessage: string | null;
  setAlertMessage: (msg: string | null) => void;
}

export const GlobalAlert: React.FC<GlobalAlertProps> = ({ alertMessage, setAlertMessage }) => {
  return (
    <AnimatePresence>
      {alertMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] pointer-events-auto">
          <div className="bg-gradient-to-r from-red-600 to-red-500 backdrop-blur-2xl border border-red-400 p-4 rounded-2xl shadow-[0_8px_30px_rgb(220,38,38,0.3)] flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20 text-white shadow-inner">
              <span className="material-symbols-outlined">error</span>
            </div>
            <div className="flex-1 mt-0.5 animate-pulse">
              <h3 className="text-white text-sm font-black uppercase tracking-wide drop-shadow-sm">
                Cảnh báo hệ thống
              </h3>
              <p className="text-red-50 text-[11.5px] font-medium mt-1 leading-relaxed drop-shadow-sm">
                {alertMessage}
              </p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalAlert;
