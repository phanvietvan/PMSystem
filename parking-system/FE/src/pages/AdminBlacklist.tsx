import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Search, Plus, ShieldAlert, AlertTriangle, Trash2, BellRing, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

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
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Danh Sách Đen & Thông Báo
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Quản lý các phương tiện bị cấm và gửi thông báo hệ thống</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Blacklist */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Phương tiện bị cấm (Blacklist)
                </h2>
                <button 
                  onClick={() => setShowAddModal(!showAddModal)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Plus size={16} /> Thêm vào danh sách
                </button>
              </div>

              {showAddModal && (
                <form onSubmit={handleAddBlacklist} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Biển số</label>
                    <input type="text" required value={newPlate} onChange={e => setNewPlate(e.target.value)} placeholder="VD: 51A-123.45" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lý do</label>
                    <input type="text" required value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Nhập lý do..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md">
                    Lưu
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 font-bold px-2">Biển số</th>
                      <th className="pb-3 font-bold px-2">Lý do</th>
                      <th className="pb-3 font-bold px-2">Ngày thêm</th>
                      <th className="pb-3 font-bold px-2">Người thêm</th>
                      <th className="pb-3 font-bold text-right px-2">Thao tác</th>
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
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4 px-2">
                            <span className="font-mono font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                              {item.plateNumber}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-sm text-slate-600 font-medium">{item.reason}</td>
                          <td className="py-4 px-2 text-sm text-slate-500">{item.date}</td>
                          <td className="py-4 px-2 text-sm font-semibold text-slate-700">{item.addedBy}</td>
                          <td className="py-4 px-2 text-right">
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 shadow-xl shadow-blue-600/20 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 relative z-10">
                <BellRing size={20} className="text-blue-200" />
                Gửi Thông Báo Khẩn
              </h2>

              <form onSubmit={handleSendNotification} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200 uppercase tracking-wider">Đối tượng nhận</label>
                  <select 
                    value={notifRole}
                    onChange={(e) => setNotifRole(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                  >
                    <option value="all">Tất cả mọi người (All)</option>
                    <option value="user">Chỉ Khách hàng (User)</option>
                    <option value="staff">Chỉ Nhân viên trực cổng (Staff)</option>
                    <option value="admin">Chỉ Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200 uppercase tracking-wider">Tiêu đề</label>
                  <input 
                    type="text" 
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="VD: Cảnh báo sập hệ thống..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200 uppercase tracking-wider">Nội dung</label>
                  <textarea 
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium resize-none"
                  ></textarea>
                </div>

                <AnimatePresence>
                  {isSent ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <CheckCircle2 size={18} />
                      Đã gửi thông báo thành công!
                    </motion.div>
                  ) : (
                    <motion.button 
                      type="submit"
                      className="w-full bg-white text-blue-700 hover:bg-blue-50 px-4 py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase tracking-widest mt-2"
                    >
                      <Send size={16} /> Gửi ngay (Push)
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </div>
            
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 text-sm text-slate-600 font-medium flex gap-3">
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
