import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Send, Check, MapPin, Layers } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

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

  const loadMyIncidents = () => {
    const reporterName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email : 'Khách vãng lai';
    const existing = localStorage.getItem('systemIncidents');
    if (existing) {
      try {
        const all: Incident[] = JSON.parse(existing);
        setMyIncidents(all.filter(inc => inc.reporter === reporterName));
      } catch (e) {}
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

    const custom = localStorage.getItem('customParkingLots');
    if (custom) {
      try {
        setBranches(JSON.parse(custom));
      } catch (e) {}
    } else {
      setBranches([
        { id: 1, name: "Landmark 81 - Bãi đỗ A1", floors: [1, 2, 3] },
        { id: 2, name: "Bitexco Financial - Bãi đỗ B2", floors: [1, 2, 3] },
        { id: 3, name: "Vincom Center - Bãi đỗ V3", floors: [1, 2, 3] }
      ]);
    }
  }, []);

  // Update default floor based on selected branch
  useEffect(() => {
    const selectedObj = branches.find(b => b.name === branch);
    if (selectedObj && selectedObj.floors && selectedObj.floors.length > 0) {
      setFloor(`Tầng ${selectedObj.floors[0]}`);
    }
  }, [branch, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const reporterName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email : 'Khách vãng lai';
    const reporterRole = user ? user.role || 'Khách hàng' : 'Khách hàng';

    const newIncident: Incident = {
      id: `#INC-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      title,
      description,
      branch,
      floor,
      urgency,
      reporter: reporterName,
      role: reporterRole,
      createdAt: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Chờ xử lý'
    };

    // Save to localStorage
    const existing = localStorage.getItem('systemIncidents');
    let list: Incident[] = [];
    if (existing) {
      try {
        list = JSON.parse(existing);
      } catch (e) {}
    }
    list = [newIncident, ...list];
    localStorage.setItem('systemIncidents', JSON.stringify(list));

    setIsSubmitted(true);
    setTitle('');
    setDescription('');
    
    // Refresh history
    setMyIncidents(list.filter(inc => inc.reporter === reporterName));
    
    // Clear submission state after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
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
            <div className="flex items-center gap-3.5 mb-8">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 shadow-inner flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Báo cáo Sự cố Hệ thống</h2>
                <p className="text-xs text-slate-400 font-medium mt-1.5">Gửi thông tin sự cố trực tiếp đến Quản trị viên (Admin) để xử lý kịp thời.</p>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Loại sự cố</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm cursor-pointer"
                    >
                      <option>Thiết bị hỏng</option>
                      <option>Lỗi thanh toán</option>
                      <option>Xe đỗ sai vị trí</option>
                      <option>Vấn đề thẻ/vé</option>
                      <option>Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Mức độ khẩn cấp</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Bình thường', 'Cao', 'Khẩn cấp'] as const).map(level => {
                        const isSelected = urgency === level;
                        const levelColors = {
                          'Bình thường': isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
                          'Cao': isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
                          'Khẩn cấp': isSelected ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        };
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setUrgency(level)}
                            className={`py-3 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${levelColors[level]}`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Chi nhánh xảy ra sự cố</label>
                    <div className="relative">
                      <select
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm cursor-pointer appearance-none"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Khu vực tầng</label>
                    <div className="relative">
                      <select
                        value={floor}
                        onChange={e => setFloor(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm cursor-pointer appearance-none"
                      >
                        {(() => {
                          const selectedObj = branches.find(b => b.name === branch);
                          const floorList = selectedObj && selectedObj.floors ? selectedObj.floors : [1, 2, 3];
                          return floorList.map((f: any) => (
                            <option key={f} value={`Tầng ${f}`}>Tầng {f}</option>
                          ));
                        })()}
                      </select>
                      <Layers className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Tiêu đề sự cố</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Rào chắn bãi đỗ xe tầng 2 Landmark 81 bị kẹt"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 ml-1">Mô tả chi tiết</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Vui lòng mô tả chi tiết sự cố gặp phải (vị trí cụ thể, hiện tượng xảy ra, lỗi màn hình nếu có...)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-slate-200/80 rounded-3xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/15 hover:shadow-rose-500/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Gửi báo cáo sự cố
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
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inc.id}</span>
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
                    <span className="text-[10px] text-slate-400 font-bold">{inc.createdAt}</span>
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
