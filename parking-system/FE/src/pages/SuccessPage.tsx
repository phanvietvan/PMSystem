import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Share2, MapPin, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const SuccessPage = () => {
  return (
    <div className="min-h-screen mesh-bg selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-2xl shadow-primary/5 text-center relative overflow-hidden"
        >
          {/* Success Header */}
          <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Đặt chỗ thành công!</h1>
          <p className="text-on-surface-variant text-sm font-medium mb-10 italic">Mã đơn hàng: #PKI-88902-Z1</p>

          {/* QR Code Container */}
          <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/20 relative mb-10 group">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem] pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Biển số: 51F-123.45</span>
            </div>
            {/* Mock QR SVG */}
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" fill="transparent"/>
              <path d="M20 20h60v60h-60zM120 20h60v60h-60zM20 120h60v60h-60z" fill="#000" fillOpacity="0.9"/>
              <path d="M40 40h20v20h-20zM140 40h20v20h-20zM40 140h20v20h-20z" fill="#fff"/>
              <rect x="90" y="20" width="20" height="20" fill="#000"/>
              <rect x="90" y="50" width="10" height="30" fill="#000"/>
              <rect x="20" y="90" width="30" height="10" fill="#000"/>
              <rect x="60" y="90" width="80" height="20" fill="#000"/>
              <rect x="150" y="90" width="30" height="10" fill="#000"/>
              <rect x="90" y="120" width="20" height="60" fill="#000"/>
              <rect x="120" y="120" width="60" height="60" fill="#000"/>
              <rect x="130" y="130" width="40" height="40" fill="#fff"/>
              <rect x="145" y="145" width="10" height="10" fill="#000"/>
            </svg>
            <p className="mt-6 text-[10px] font-black text-outline uppercase tracking-[0.3em]">Mã định danh duy nhất</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
              <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Vị trí</span>
              <p className="text-sm font-black text-on-surface">Tầng 03 • A3</p>
            </div>
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
              <span className="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Thời gian</span>
              <p className="text-sm font-black text-on-surface">08:30 AM</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              <Download className="w-4 h-4" />
              Lưu mã QR về điện thoại
            </button>
            <div className="flex gap-3">
              <button className="flex-1 bg-surface-container hover:bg-surface-container-high font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs">
                <Share2 className="w-4 h-4" /> Chia sẻ
              </button>
              <Link to="/gate-scan" className="flex-1 bg-primary text-on-primary font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-primary/20">
                Tới cổng bãi đỗ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10 flex items-start gap-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-[10px] text-primary font-medium text-left leading-relaxed italic">
              Vui lòng đưa mã QR này trước Camera nhận diện tại cổng bãi đỗ để Barrier tự động mở. Mã có hiệu lực trong vòng 30 phút từ giờ đặt chỗ.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SuccessPage;
