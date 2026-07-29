import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomTimePickerProps {
  value: string; // "HH:mm" 24h
  onChange: (value: string) => void;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00' };
    const [hStr, mStr] = timeStr.split(':');
    const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(mStr || '0', 10) || 0));
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
    };
  };

  const { hour, minute } = parseTime(value);

  const updateTime = (newHour: string, newMinute: string) => {
    onChange(`${newHour.padStart(2, '0')}:${newMinute.padStart(2, '0')}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      const scrollActive = (ref: React.RefObject<HTMLDivElement | null>, activeVal: string) => {
        const parent = ref.current;
        if (!parent) return;
        const activeEl = parent.querySelector(`[data-value="${activeVal}"]`);
        if (!activeEl) return;
        const parentRect = parent.getBoundingClientRect();
        const childRect = activeEl.getBoundingClientRect();
        parent.scrollTop +=
          childRect.top - parentRect.top - parent.clientHeight / 2 + childRect.height / 2;
      };
      scrollActive(hourRef, hour);
      scrollActive(minuteRef, minute);
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, hour, minute]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="premium-input w-full pl-5 pr-5 py-2.5 rounded-full border border-outline-variant/80 hover:border-blue-500/40 text-xs font-semibold cursor-pointer shadow-sm bg-white flex items-center justify-between transition-all duration-300 group hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-blue-500" />
          <span className="font-extrabold text-slate-800 dark:text-slate-200">
            {hour}:{minute}
          </span>
        </div>
        <span
          className={`material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[2500] left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/90 overflow-hidden dark:bg-slate-900/95 dark:border-slate-800/90"
          >
            <div className="grid grid-cols-2 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest py-2 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
              <div>Giờ (0–23)</div>
              <div>Phút</div>
            </div>

            <div className="grid grid-cols-2 h-48 select-none divide-x divide-slate-50 dark:divide-slate-800/50">
              <div
                ref={hourRef}
                className="overflow-y-auto scrollbar-none py-1 scroll-smooth flex flex-col items-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="h-16 shrink-0" />
                {hours.map((h) => {
                  const isActive = h === hour;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={() => updateTime(h, minute)}
                      className={`w-12 py-2 text-xs font-extrabold rounded-lg my-0.5 transition-all duration-200 cursor-pointer text-center
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`}
                    >
                      {h}
                    </button>
                  );
                })}
                <div className="h-16 shrink-0" />
              </div>

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
                      onClick={() => updateTime(hour, m)}
                      className={`w-12 py-2 text-xs font-extrabold rounded-lg my-0.5 transition-all duration-200 cursor-pointer text-center
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`}
                    >
                      {m}
                    </button>
                  );
                })}
                <div className="h-16 shrink-0" />
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
