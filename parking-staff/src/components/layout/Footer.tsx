import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl border-t border-slate-200/80 px-10 flex justify-between items-center z-50 text-[9px] tracking-widest text-slate-400 font-bold uppercase shrink-0">
      <span>© 2026 PM SYSTEM PORTAL • CHUẨN AN NINH CẤP CAO</span>
      <div className="flex gap-8">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Độ trễ: 0.4ms
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-blue-500" />
          AES-256
        </span>
      </div>
    </footer>
  );
};

export default Footer;
