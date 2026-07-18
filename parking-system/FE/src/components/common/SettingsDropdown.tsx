import { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Check } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings.tsx';

interface SettingsDropdownProps {
  className?: string;
}

const SettingsDropdown = ({ className = '' }: SettingsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useSettings();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 group active:scale-95"
        title="Cài đặt"
        aria-label="Cài đặt"
      >
        <Settings
          size={18}
          className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 group-hover:scale-110 ${isOpen ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/60 z-50 overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Settings size={12} className="text-blue-500" />
              Cài đặt
            </p>
          </div>

          <div className="p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 pt-1 pb-2">
              Giao diện
            </p>

            <button
              onClick={() => { if (theme === 'dark') toggleTheme(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
              }`}>
                <Sun size={14} />
              </div>
              <span className="flex-1 text-left">Chế độ sáng</span>
              {theme === 'light' && (
                <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </button>

            <button
              onClick={() => { if (theme === 'light') toggleTheme(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
              }`}>
                <Moon size={14} />
              </div>
              <span className="flex-1 text-left">Chế độ tối</span>
              {theme === 'dark' && (
                <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
