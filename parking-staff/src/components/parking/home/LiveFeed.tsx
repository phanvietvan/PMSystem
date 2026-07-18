import React from 'react';
import { Camera, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveFeedProps {
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasCameraAccess: boolean;
  startCamera: () => void;
  isOcrLoading: boolean;
  gateMode: 'ENTRY' | 'EXIT';
  manualInput: string;
  setManualInput: (val: string) => void;
  handleOcrAndScan: () => void;
  triggerScan: (input: string) => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({
  gateState,
  videoRef,
  hasCameraAccess,
  startCamera,
  isOcrLoading,
  gateMode,
  manualInput,
  setManualInput,
  handleOcrAndScan,
  triggerScan,
}) => {
  return (
    <div
      className={`absolute inset-0 bg-slate-950 transition-opacity duration-300 ${
        gateState === 'SCANNING' ? 'opacity-100 pointer-events-auto z-0' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />

      {!hasCameraAccess && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
          <Camera className="text-slate-700 animate-bounce" size={42} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Không tìm thấy Camera</p>
          <button
            onClick={startCamera}
            className="text-xs font-bold text-blue-400 border border-blue-900/60 px-4 py-2 rounded-full bg-blue-955/40 cursor-pointer hover:bg-blue-900/20 transition-all uppercase tracking-wider"
          >
            Kích hoạt
          </button>
        </div>
      )}

      {gateState === 'SCANNING' && (
        <div className="flex-1 flex flex-col relative bg-transparent z-10 pointer-events-auto animate-fade-in h-full">
          {/* Camera AI OCR LPR Loader */}
          <AnimatePresence>
            {isOcrLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col items-center justify-center gap-4 text-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                  <Zap className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={24} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold uppercase tracking-wider">
                    Hệ thống AI LPR đang định danh biển số...
                  </p>
                  <p className="text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-widest animate-pulse">
                    Đang trích xuất văn bản & lưu MongoDB...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera Header Overlay */}
          <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl border border-white/70 px-4 py-2 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                LIVE FEED • CAMERA LỐI SOÁT
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-full backdrop-blur-xl border-none shadow-sm ${
                gateMode === 'ENTRY' ? 'bg-blue-600/90 text-white' : 'bg-amber-600/90 text-white'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {gateMode === 'ENTRY' ? 'CỔNG VÀO (ENTRY)' : 'CỔNG RA (EXIT)'}
              </span>
            </div>
          </div>

          {/* Scanner Box + Bottom Overlay */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center h-full">
            {/* Scanner frame */}
            <div
              className="relative w-80 h-56 cursor-pointer flex flex-col items-center justify-center"
              onClick={() => handleOcrAndScan()}
              style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2)' }}
            >
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
              <span className="material-symbols-outlined text-6xl text-blue-500/40 mb-3">qr_code_scanner</span>
              <span className="text-sm font-extrabold text-white drop-shadow-md text-center uppercase tracking-widest leading-relaxed">
                ĐƯA MÃ QR VÀO
                <br />
                KHUNG QUÉT
              </span>
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] scanner-line !animate-[scan_3s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Bottom gradient overlay with status text */}
          <div className="absolute bottom-0 w-full z-10 flex flex-col items-center justify-end bg-gradient-to-t from-black/60 to-transparent pt-24 pb-24 pointer-events-none">
            <h2 className="text-white text-xl font-bold tracking-wide mb-1.5">ĐANG CHỜ MÃ QR</h2>
            <p className="text-white/80 text-xs font-medium">ĐƯA MÃ QR CỦA KHÁCH HÀNG VÀO TRƯỚC CAMERA SOÁT VÉ</p>
            <p className="text-[10px] text-white/50 font-medium mt-1">
              (Hoặc nhập mã QR thủ công ở thanh công cụ bên dưới)
            </p>
          </div>

          {/* Manual Input Bar - Glass Pill */}
          <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/75 backdrop-blur-2xl border border-white/90 rounded-full p-2 flex items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  const input = manualInput.trim().toUpperCase();
                  setManualInput('');
                  triggerScan(input);
                }
              }}
              className="flex-1 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-slate-400 ml-3 text-[20px]">keyboard</span>
              <input
                className="bg-transparent border-none w-full text-slate-800 font-semibold text-sm placeholder:text-slate-400 tracking-wide outline-none px-2"
                placeholder="NHẬP MÃ QR CỦA XE (VÍ DỤ: QR_...)..."
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </form>
            <button
              onClick={() => handleOcrAndScan()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              XÁC THỰC MÃ QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
