import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Plus, ShieldAlert, AlertTriangle, Trash2, BellRing, Send, CheckCircle2, ShieldCheck, CalendarDays, Clock, History, Users, Megaphone, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const DarkCustomSelect = ({ value, onChange, options }: any) => {
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
        className={`w-full px-4 pr-10 py-3.5 bg-white/10 border ${isOpen ? 'border-white/50 ring-2 ring-white/20' : 'border-white/20 hover:border-white/40'} rounded-xl text-sm font-semibold text-white shadow-sm cursor-pointer transition-all flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{options.find((o:any) => o.value === value)?.label || value}</span>
        <svg className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto px-1.5">
            {options.map((opt: any, idx: number) => {
              const isSelected = value === opt.value;
              return (
                <div 
                  key={idx}
                  className={`px-4 py-3 mx-1 my-0.5 rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminBlacklist = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [notifRole, setNotifRole] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchBlacklist = async () => {
    try {
      const res = await api.get('/Blacklist');
      setBlacklist(res.data);
    } catch (error) {
      console.error('Error fetching blacklist', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingReports = async () => {
    try {
      const res = await api.get('/Incidents');
      const pending = res.data.filter((i: any) => i.type === 'BlacklistReport' && i.status === 'Chờ xử lý');
      setPendingReports(pending);
    } catch (error) {
      console.error('Error fetching reports', error);
    }
  };

  useEffect(() => {
    fetchBlacklist();
    fetchNotifHistory();
    fetchPendingReports();

    // Real-time polling for pending reports (3s)
    const interval = setInterval(() => {
      fetchPendingReports();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleResolveReport = async (report: any, action: 'approve' | 'reject') => {
    if (action === 'approve' && !window.confirm('Xác nhận đưa phương tiện này vào danh sách đen?')) return;
    if (action === 'reject' && !window.confirm('Từ chối báo cáo này?')) return;
    
    let plate = report.title.replace('Báo cáo xe vi phạm:', '').trim();
    if (!plate) plate = 'KHONG_RO';

    let reasonToSave = report.description;
    try {
      const parsed = JSON.parse(report.description);
      if (parsed && parsed.reason) {
        reasonToSave = parsed.reason;
      }
    } catch(e) {}

    try {
      if (action === 'approve') {
        await api.post('/Blacklist', { plateNumber: plate, reason: reasonToSave });
      }
      await api.put(`/Incidents/${report.id}/resolve`);
      fetchBlacklist();
      fetchPendingReports();
    } catch (e) {
      console.error(e);
      alert('Thao tác thất bại');
    }
  };

  const fetchNotifHistory = async () => {
    try {
      const res = await api.get('/Notifications');
      setNotifHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching notification history', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    
    try {
      await api.post('/Notifications/push', {
        role: notifRole,
        title: notifTitle,
        message: notifMessage
      });
      setIsSent(true);
      fetchNotifHistory();
      setTimeout(() => {
        setIsSent(false);
        setNotifTitle('');
        setNotifMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error pushing notification', error);
      alert('Gửi thông báo thất bại');
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newReason) return;
    try {
      await api.post('/Blacklist', { plateNumber: newPlate, reason: newReason });
      setNewPlate('');
      setNewReason('');
      setShowAddModal(false);
      fetchBlacklist();
    } catch (error) {
      console.error('Error adding to blacklist', error);
      alert('Thêm thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa khỏi danh sách đen?')) return;
    try {
      await api.delete(`/Blacklist/${id}`);
      fetchBlacklist();
    } catch (error) {
      console.error('Error deleting', error);
    }
  };

  const filteredList = blacklist.filter(item => item.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout
      searchPlaceholder="Tìm biển số trong danh sách đen..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header Title */}
        <div className="mb-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Danh Sách Đen & Thông Báo
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 font-medium">Quản lý các phương tiện bị cấm và gửi thông báo hệ thống</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white p-6 rounded-[1.5rem] border border-slate-200/80 shadow-lg shadow-slate-200/30 flex items-center gap-5 group hover:-translate-y-0.5 transition-all">
            <div className="p-3.5 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TỔNG BỊ CẤM</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{blacklist.length}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white p-6 rounded-[1.5rem] border border-slate-200/80 shadow-lg shadow-slate-200/30 flex items-center gap-5 group hover:-translate-y-0.5 transition-all">
            <div className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">THÊM TRONG TUẦN</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {blacklist.filter((item: any) => {
                  const d = new Date(item.date);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return d >= weekAgo;
                }).length}
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-white p-6 rounded-[1.5rem] border border-slate-200/80 shadow-lg shadow-slate-200/30 flex items-center gap-5 group hover:-translate-y-0.5 transition-all">
            <div className="p-3.5 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ĐÃ GỬi THÔNG BÁO</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{notifHistory.length}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Blacklist */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Pending Reports Section */}
            {pendingReports.length > 0 && (
              <div className="bg-amber-50/50 rounded-[2rem] p-8 border border-amber-200/50 shadow-xl shadow-amber-100/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Báo cáo chờ duyệt ({pendingReports.length})</h2>
                    <p className="text-xs font-bold text-amber-600">Admin cần xem xét để đưa vào danh sách đen</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {pendingReports.map(report => {
                    const plate = report.title.replace('Báo cáo xe vi phạm:', '').trim();
                    let details: any = null;
                    let displayReason = report.description;
                    try {
                      details = JSON.parse(report.description);
                      if (details && typeof details === 'object' && details.reason) {
                        displayReason = details.reason;
                      }
                    } catch (e) {
                      // plain string
                    }

                    return (
                      <div key={report.id} className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-start group hover:border-amber-300 transition-colors">
                        <div className="flex gap-4 w-full">
                          {details?.photo && (
                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm bg-slate-100 hidden sm:block">
                              <img src={details.photo} alt="Xe" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-sm">
                                {plate}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(report.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            
                            {details && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Chủ xe & Liên hệ</span>
                                  <span className="font-semibold text-slate-700">{details.customerName || 'Khách vãng lai'} {details.customerPhone && <><br/>{details.customerPhone}</>}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px] mb-0.5">Khu vực & Thời gian vào</span>
                                  <span className="font-semibold text-slate-700">{details.parkingLot || 'Không rõ'} <br/>{details.entryTime || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            <p className="text-sm font-semibold text-slate-700">Lý do: <span className="font-medium text-slate-600">{displayReason}</span></p>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Người báo cáo: {report.reporter}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => handleResolveReport(report, 'reject')}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors tooltip"
                            title="Từ chối báo cáo"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => handleResolveReport(report, 'approve')}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border border-red-100 shadow-sm"
                          >
                            <Check size={18} />
                            Đưa vào Blacklist
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/80 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                  <AlertTriangle className="text-amber-500" size={22} />
                  Phương tiện bị cấm (Blacklist)
                </h2>
                <button 
                  onClick={() => setShowAddModal(!showAddModal)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Plus size={16} /> Thêm vào danh sách
                </button>
              </div>

              {showAddModal && (
                <form onSubmit={handleAddBlacklist} className="mb-8 bg-white p-5 rounded-[1.5rem] border border-slate-200 flex flex-wrap gap-4 items-end shadow-sm">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Biển số</label>
                    <input type="text" required value={newPlate} onChange={e => setNewPlate(e.target.value)} placeholder="VD: 51A-123.45" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do</label>
                    <input type="text" required value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Nhập lý do..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm" />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-md hover:shadow-lg">
                    Lưu
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="pb-4 font-bold px-2">Biển số</th>
                      <th className="pb-4 font-bold px-2">Lý do</th>
                      <th className="pb-4 font-bold px-2">Ngày thêm</th>
                      <th className="pb-4 font-bold px-2">Người thêm</th>
                      <th className="pb-4 font-bold text-right px-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">Đang tải...</td></tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                              <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">Không có phương tiện bị cấm</p>
                            <p className="text-xs text-slate-400 mt-1">Hệ thống đang sạch, không có xe nào trong danh sách đen 🎉</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors group">
                          <td className="py-5 px-2">
                            <span className="font-mono font-black text-slate-800 bg-slate-100/80 px-3.5 py-2 rounded-lg border border-slate-200/60 shadow-sm text-sm">
                              {item.plateNumber}
                            </span>
                          </td>
                          <td className="py-5 px-2 text-sm text-slate-600 font-semibold">{item.reason}</td>
                          <td className="py-5 px-2 text-sm text-slate-500 font-medium">
                            {item.date?.includes('T') ? new Date(item.date).toISOString().split('T')[0] : item.date}
                          </td>
                          <td className="py-5 px-2 text-sm font-bold text-slate-700">{item.addedBy}</td>
                          <td className="py-5 px-2 text-right">
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Send Notification */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#4361ee] rounded-[2rem] p-8 shadow-xl shadow-blue-600/20 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <h2 className="text-lg font-bold flex items-center gap-2 mb-8 relative z-10">
                <BellRing size={22} className="text-blue-200" />
                Gửi Thông Báo Khẩn
              </h2>

              <form onSubmit={handleSendNotification} className="space-y-5 relative z-10">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">ĐỐI TƯỢNG NHẬN</label>
                  <DarkCustomSelect 
                    value={notifRole}
                    onChange={(val: string) => setNotifRole(val)}
                    options={[
                      { value: 'all', label: 'Tất cả mọi người (All)' },
                      { value: 'user', label: 'Chỉ Khách hàng (User)' },
                      { value: 'staff', label: 'Chỉ Nhân viên trực cổng (Staff)' },
                      { value: 'admin', label: 'Chỉ Quản trị viên (Admin)' }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">TIÊU ĐỀ</label>
                  <input 
                    type="text" 
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="VD: Cảnh báo sập hệ thống..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-semibold shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">NỘI DUNG</label>
                  <textarea 
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-semibold resize-none shadow-sm"
                  ></textarea>
                </div>

                <AnimatePresence>
                  {isSent ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm mt-4"
                    >
                      <CheckCircle2 size={18} />
                      Đã gửi thành công!
                    </motion.div>
                  ) : (
                    <motion.button 
                      type="submit"
                      className="w-full bg-white text-[#4361ee] hover:bg-blue-50 px-4 py-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase tracking-widest mt-4 cursor-pointer"
                    >
                      <Send size={18} /> GỬI NGAY (PUSH)
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </div>
            
            <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-100 text-[13px] text-slate-600 font-medium flex gap-3 shadow-sm">
              <div className="shrink-0 text-blue-500 mt-0.5">
                <ShieldAlert size={18} />
              </div>
              <p className="leading-relaxed">
                Hệ thống sẽ đẩy (Push Notification) thông báo trực tiếp đến giao diện của các <strong>{notifRole.toUpperCase()}</strong> đang online. Chuông thông báo của họ sẽ hiển thị chấm đỏ.
              </p>
            </div>

            {/* Notification History */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-800">Lịch sử thông báo</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{notifHistory.length} thông báo đã gửi</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-3 max-h-[400px] overflow-y-auto">
                      {notifHistory.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6 font-medium">Chưa có thông báo nào.</p>
                      ) : (
                        notifHistory.map((n: any, i: number) => (
                          <div key={n.id || i} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/60 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                <BellRing className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 truncate">{n.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">{n.desc}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {n.time}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlacklist;
