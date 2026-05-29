import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Send, Check, MapPin, Layers } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

interface Incident {
  id: string;
  type: string;
  title: string;
  description: string;
  branch: string;
  floor: string;
  urgency: 'Bình thường' | 'Cao' | 'Khẩn cấp';
  reporter: string;
  role: string;
  createdAt: string;
  status: 'Chờ xử lý' | 'Đã xử lý';
}

const CustomSelect = ({ value, onChange, options, icon: Icon, isError = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div 
        className={`w-full ${Icon ? 'pl-12' : 'px-5'} pr-10 py-3.5 bg-white border ${isError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} rounded-full text-sm font-semibold text-slate-800 shadow-sm cursor-pointer transition-all flex items-center justify-between ${isOpen && !isError ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : ''} hover:border-blue-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <span className="truncate">{options.find((o:any) => o.value === value)?.label || value}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar px-1.5">
            {options.map((opt: any, idx: number) => {
              const isSelected = value === opt.value;
              return (
                <div 
                  key={idx}
                  className={`px-4 py-3 mx-1 my-0.5 rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ReportIncidentPage = () => {
  const [user, setUser] = useState<any>(null);
  const [type, setType] = useState('Thiết bị hỏng');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('Landmark 81 - Bãi đỗ A1');
  const [floor, setFloor] = useState('Tầng 1');
  const [urgency, setUrgency] = useState<'Bình thường' | 'Cao' | 'Khẩn cấp'>('Bình thường');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available branches from localStorage or default
  const [branches, setBranches] = useState<any[]>([]);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);

  const loadMyIncidents = async () => {
    const reporterName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email : 'Khách vãng lai';
    try {
      const response = await api.get('/Incidents');
      if (response.data) {
        const allIncidents: Incident[] = response.data;
        setMyIncidents(allIncidents.filter(inc => inc.reporter === reporterName));
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      setMyIncidents([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyIncidents();
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    const loadBranches = async () => {
      try {
        const response = await api.get('/ParkingLots');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setBranches(response.data);
          return;
        }
      } catch (e) {
        console.error('Error fetching parking lots:', e);
      }
      // Fallback
      setBranches([
        { id: 1, name: "Landmark 81 - Bãi đỗ A1", floors: [1, 2, 3] },
        { id: 2, name: "Bitexco Financial - Bãi đỗ B2", floors: [1, 2, 3] },
        { id: 3, name: "Vincom Center - Bãi đỗ V3", floors: [1, 2, 3] }
      ]);
    };
    loadBranches();
  }, []);

  // Update default floor based on selected branch
  useEffect(() => {
    const selectedObj = branches.find(b => b.name === branch);
    if (selectedObj && selectedObj.floors && selectedObj.floors.length > 0) {
      setFloor(`Tầng ${selectedObj.floors[0]}`);
    }
  }, [branch, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const reporterName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email : 'Khách vãng lai';
    const reporterRole = user ? user.role || 'Khách hàng' : 'Khách hàng';

    const newIncidentPayload = {
      type,
      title,
      description,
      branch,
      floor,
      urgency,
      reporter: reporterName,
      role: reporterRole
    };

    try {
      await api.post('/Incidents', newIncidentPayload);
      setIsSubmitted(true);
      setTitle('');
      setDescription('');
      
      await loadMyIncidents();
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      setIsSubmitted(true);
      setTitle('');
      setDescription('');
      
      // Reload incidents from API
      await loadMyIncidents();
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting incident to database:', error);
      alert('Không thể gửi báo cáo sự cố lúc này. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-28 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 sm:p-10 rounded-[32px] border border-slate-200/80 shadow-xl relative overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-400/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Báo cáo Sự cố Hệ thống</h2>
                <p className="text-[13px] text-slate-500 font-medium mt-1">Gửi thông tin sự cố trực tiếp đến Quản trị viên (Admin) để xử lý kịp thời.</p>
              </div>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-850">Báo cáo của bạn đã được gửi thành công!</h3>
                <p className="text-xs text-slate-500 max-w-md">Cảm ơn sự đóng góp của bạn. Ban quản lý bãi xe đã nhận được thông tin và sẽ kiểm tra khắc phục trong thời gian sớm nhất.</p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-350 text-xs font-bold text-slate-700 rounded-full shadow-sm transition-all cursor-pointer"
                >
                  Gửi thêm báo cáo khác
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">LOẠI SỰ CỐ</label>
                      <CustomSelect
                        value={type}
                        onChange={(val: string) => setType(val)}
                        isError={true} // Giữ viền đỏ theo mockup
                        options={[
                          { value: 'Thiết bị hỏng', label: 'Thiết bị hỏng' },
                          { value: 'Lỗi thanh toán', label: 'Lỗi thanh toán' },
                          { value: 'Xe đỗ sai vị trí', label: 'Xe đỗ sai vị trí' },
                          { value: 'Vấn đề thẻ/vé', label: 'Vấn đề thẻ/vé' },
                          { value: 'Khác', label: 'Khác' }
                        ]}
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Rào chắn bãi đỗ xe tầng 2 Landmark 81 bị kẹt"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">CHI NHÁNH</label>
                      <CustomSelect
                        icon={MapPin}
                        value={branch}
                        onChange={(val: string) => setBranch(val)}
                        options={branches.map(b => ({ value: b.name, label: b.name }))}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">MỨC ĐỘ KHẨN CẤP</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['Bình thường', 'Cao', 'Khẩn cấp'] as const).map(level => {
                          const isSelected = urgency === level;
                          const levelColors = {
                            'Bình thường': isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
                            'Cao': isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
                            'Khẩn cấp': isSelected ? 'bg-rose-600 text-white border-rose-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          };
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setUrgency(level)}
                              className={`py-3 text-[11px] font-bold rounded-full border transition-all cursor-pointer shadow-sm ${levelColors[level]}`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">KHU VỰC TẦNG</label>
                      <CustomSelect
                        icon={Layers}
                        value={floor}
                        onChange={(val: string) => setFloor(val)}
                        options={(() => {
                          const selectedObj = branches.find(b => b.name === branch);
                          const floorList = selectedObj && selectedObj.floors ? selectedObj.floors : [1, 2, 3];
                          return floorList.map((f: any) => ({ value: `Tầng ${f}`, label: `Tầng ${f}` }));
                        })()}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">MÔ TẢ CHI TIẾT</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Vui lòng mô tả chi tiết sự cố gặp phải (vị trí cụ thể, hiện tượng xảy ra, lỗi màn hình nếu có...)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#f00] hover:bg-red-700 text-white font-bold py-4 px-6 rounded-full text-[13px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-8 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  GỬI BÁO CÁO SỰ CỐ
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Incident History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-8 sm:p-10 rounded-[32px] border border-slate-200/80 shadow-xl mt-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Lịch sử báo cáo của bạn</h3>
          
          {myIncidents.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold text-center py-8">Bạn chưa gửi báo cáo sự cố nào.</p>
          ) : (
            <div className="space-y-4">
              {myIncidents.map(inc => (
                <div key={inc.id} className="p-5 rounded-2xl border border-slate-100 hover:border-blue-200/50 bg-slate-50/50 hover:bg-blue-50/10 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {inc.id.startsWith('#') ? inc.id : '#INC-' + inc.id.substring(0, 4).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        inc.urgency === 'Khẩn cấp' ? 'bg-rose-100 text-rose-600 animate-pulse' :
                        inc.urgency === 'Cao' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {inc.urgency}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        inc.status === 'Đã xử lý' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {inc.createdAt.includes('T') || inc.createdAt.includes('-') 
                        ? new Date(inc.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) 
                        : inc.createdAt}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-850 mt-2.5 leading-snug">{inc.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{inc.description}</p>
                  
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-3 border-t border-slate-100 pt-2.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500/80" />
                    <span>{inc.branch} • {inc.floor}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ReportIncidentPage;
