import React from 'react';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhotoPreviewModalProps {
  photo: string | null;
  onClose: () => void;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl max-w-lg w-full p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Camera size={13} className="text-blue-500 animate-pulse" /> ẢNH CHỤP LÚC XE RA / VÀO TRỰC TIẾP
          </span>
          <button
            onClick={onClose}
            className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase cursor-pointer"
          >
            Đóng
          </button>
        </div>
        <div className="h-80 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <img src={photo} alt="Audit Photo Full" className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </div>
  );
};

export default PhotoPreviewModal;
