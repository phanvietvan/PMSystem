import { useState, useEffect } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const AdminIncidents = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/Incidents');
      if (response.data) {
        setIncidents(response.data);
      }
    } catch (error) {
      console.error('Error fetching incidents from db:', error);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleResolveIncident = async (id: string) => {
    try {
      await api.put(`/Incidents/${id}/resolve`);
      await fetchIncidents();
      showToast('Đã đánh dấu sự cố là Đã giải quyết!', 'success');
    } catch (error) {
      console.error('Error resolving incident in db:', error);
      showToast('Lỗi khi đánh dấu giải quyết.', 'error');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await api.delete(`/Incidents/${id}`);
      await fetchIncidents();
      showToast('Đã xóa báo cáo sự cố thành công!', 'info');
    } catch (error) {
      console.error('Error deleting incident in db:', error);
      showToast('Lỗi khi xóa báo cáo.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="p-10 space-y-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý sự cố hệ thống</h2>
          <p className="text-sm text-slate-500 font-medium">Theo dõi và giải quyết các báo cáo sự cố từ người dùng và nhân viên trực ban.</p>
        </div>

        {/* Incident Reports Table */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Sự cố hệ thống cần xử lý</h3>
                 <p className="text-xs text-slate-400 font-bold mt-1">Danh sách các báo cáo từ khách hàng & nhân viên trực ban</p>
              </div>
              <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-full">
                 {incidents.filter(inc => inc.status === 'Chờ xử lý').length} Chưa xử lý
              </span>
           </div>
           
           {incidents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                 Chưa ghi nhận sự cố nào trong hệ thống.
              </div>
           ) : (
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-slate-100">
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã sự cố</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại & Tiêu đề</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị trí</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người báo cáo</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ khẩn cấp</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {incidents.map((inc) => (
                       <tr key={inc.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                         <td className="py-5 text-xs font-black text-slate-500">
                           {inc.id.startsWith('#') ? inc.id : '#INC-' + inc.id.substring(0, 4).toUpperCase()}
                         </td>
                         <td className="py-5 max-w-xs">
                           <div className="min-w-0">
                             <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase mb-1.5 ${
                               inc.type === 'Thiết bị hỏng' ? 'bg-red-50 text-red-600' :
                               inc.type === 'Lỗi thanh toán' ? 'bg-amber-50 text-amber-600' :
                               inc.type === 'Xe đỗ sai vị trí' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                             }`}>
                               {inc.type}
                             </span>
                             <p className="text-xs font-bold text-slate-900 leading-snug">{inc.title}</p>
                             <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{inc.description}</p>
                           </div>
                         </td>
                         <td className="py-5">
                           <div className="text-xs font-bold text-slate-800">{inc.branch}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{inc.floor}</div>
                         </td>
                         <td className="py-5">
                           <div className="text-xs font-bold text-slate-900">{inc.reporter}</div>
                           <div className="text-[9px] text-slate-400 font-black uppercase">{inc.role}</div>
                         </td>
                         <td className="py-5">
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                             inc.urgency === 'Khẩn cấp' ? 'bg-rose-100 text-rose-600 animate-pulse' :
                             inc.urgency === 'Cao' ? 'bg-amber-100 text-amber-600' :
                             'bg-slate-100 text-slate-600'
                           }`}>
                             {inc.urgency}
                           </span>
                         </td>
                         <td className="py-5">
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                             inc.status === 'Đã xử lý' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                           }`}>
                             {inc.status}
                           </span>
                         </td>
                         <td className="py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {inc.status === 'Chờ xử lý' && (
                               <button
                                 onClick={() => handleResolveIncident(inc.id)}
                                 className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                               >
                                 Giải quyết
                               </button>
                             )}
                             <button
                               onClick={() => handleDeleteIncident(inc.id)}
                               className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors cursor-pointer"
                               title="Xóa báo cáo"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           )}
        </div>
      </div>

      {/* Custom Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/10'
                : toastMessage.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400/50 shadow-rose-500/10'
                : 'bg-slate-900/90 text-white border-slate-700/50 shadow-slate-900/10'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">✓</div>
            ) : toastMessage.type === 'error' ? (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">✕</div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">i</div>
            )}
            <span className="text-xs font-black tracking-wide uppercase">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminIncidents;
