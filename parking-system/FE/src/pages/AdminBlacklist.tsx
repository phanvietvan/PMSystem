import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Plus, ShieldAlert, AlertTriangle, Trash2, BellRing, Send, CheckCircle2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  const [notifRole, setNotifRole] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

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

  useEffect(() => {
    fetchBlacklist();
  }, []);

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
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Danh Sách Đen & Thông Báo
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 font-medium">Quản lý các phương tiện bị cấm và gửi thông báo hệ thống</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Blacklist */}
          <div className="lg:col-span-8 space-y-6">
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
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          Không tìm thấy biển số nào.
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
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlacklist;
