import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomTimePickerProps {
  value: string; // "HH:mm" format
  onChange: (value: string) => void;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Parse "HH:mm" to 12h format
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour12: "12", minute: "00", period: "AM" };
    const [hStr, mStr] = timeStr.split(':');
    const h24 = parseInt(hStr, 10);
    const m = mStr || "00";
    
    let period = "AM";
    let h12 = h24;
    if (h24 >= 12) {
      period = "PM";
      if (h24 > 12) h12 = h24 - 12;
    }
    if (h12 === 0) h12 = 12;

    const hour12 = h12.toString().padStart(2, '0');
    return { hour12, minute: m, period };
  };

  const { hour12, minute, period } = parseTime(value);

  // Convert 12h to 24h and trigger onChange
  const updateTime = (newHour12: string, newMinute: string, newPeriod: string) => {
    const h12 = parseInt(newHour12, 10);
    let h24 = h12;
    if (newPeriod === "PM" && h12 < 12) h24 = h12 + 12;
    if (newPeriod === "AM" && h12 === 12) h24 = 0;
    
    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMinute = newMinute;
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active elements into view when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const scrollActive = (ref: React.RefObject<HTMLDivElement | null>, activeVal: string) => {
          const parent = ref.current;
          if (!parent) return;
          const activeEl = parent.querySelector(`[data-value="${activeVal}"]`);
          if (activeEl) {
            const parentRect = parent.getBoundingClientRect();
            const childRect = activeEl.getBoundingClientRect();
            const relativeTop = childRect.top - parentRect.top;
            parent.scrollTop = parent.scrollTop + relativeTop - (parent.clientHeight / 2) + (childRect.height / 2);
          }
        };
        scrollActive(hourRef, hour12);
        scrollActive(minuteRef, minute);
        scrollActive(periodRef, period);
      }, 50);
    }
  }, [isOpen, hour12, minute, period]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ["AM", "PM"];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Selector Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="premium-input w-full pl-5 pr-5 py-2.5 rounded-full border border-outline-variant/80 hover:border-blue-500/40 text-xs font-semibold cursor-pointer shadow-sm bg-white flex items-center justify-between transition-all duration-300 group hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-blue-500" />
          <span className="font-extrabold text-slate-800 dark:text-slate-200">
            {hour12}:{minute} {period}
          </span>
        </div>
        <span className={`material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          keyboard_arrow_down
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[2500] left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/90 overflow-hidden dark:bg-slate-900/95 dark:border-slate-800/90"
          >
            {/* Header titles */}
            <div className="grid grid-cols-3 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest py-2 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
              <div>Giờ</div>
              <div>Phút</div>
              <div>Buổi</div>
            </div>

            {/* List Selection Grid */}
            <div className="grid grid-cols-3 h-48 select-none divide-x divide-slate-50 dark:divide-slate-800/50">
              {/* Hour Column */}
              <div 
                ref={hourRef}
                className="overflow-y-auto scrollbar-none py-1 scroll-smooth flex flex-col items-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="h-16 shrink-0" />
                {hours.map((h) => {
                  const isActive = h === hour12;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={() => updateTime(h, minute, period)}
                      className={`w-12 py-2 text-xs font-extrabold rounded-lg my-0.5 transition-all duration-200 cursor-pointer text-center
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'}`}
                    >
                      {h}
                    </button>
                  );
                })}
                <div className="h-16 shrink-0" />
              </div>

              {/* Minute Column */}
              <div 
                ref={minuteRef}
                className="overflow-y-auto scrollbar-none py-1 scroll-smooth flex flex-col items-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="h-16 shrink-0" />
                {minutes.map((m) => {
                  const isActive = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-value={m}
                      onClick={() => updateTime(hour12, m, period)}
                      className={`w-12 py-2 text-xs font-extrabold rounded-lg my-0.5 transition-all duration-200 cursor-pointer text-center
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'}`}
                    >
                      {m}
                    </button>
                  );
                })}
                <div className="h-16 shrink-0" />
              </div>

              {/* Period Column */}
              <div 
                ref={periodRef}
                className="overflow-y-auto scrollbar-none py-1 scroll-smooth flex flex-col items-center justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {periods.map((p) => {
                  const isActive = p === period;
                  return (
                    <button
                      key={p}
                      type="button"
                      data-value={p}
                      onClick={() => updateTime(hour12, minute, p)}
                      className={`w-16 py-2 text-xs font-extrabold rounded-lg my-1 transition-all duration-200 cursor-pointer text-center
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
