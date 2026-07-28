import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Car,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';
import { usePricing } from '../hooks/usePricing';
import { useRegulations } from '../hooks/useRegulations';

type PriceItem = { type: string; price: string; sub: string };

const SUB_OPTIONS = ['VNĐ / Giờ', 'VNĐ / Lượt', 'VNĐ / Ngày'];

const AdminSettings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Cập nhật thành công');
  const { prices, setPrices, savePricing } = usePricing();
  const { regulations, setRegulations, saveRegulations } = useRegulations();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const flashToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePriceFieldChange = (index: number, field: keyof PriceItem, value: string) => {
    const updated = [...prices] as PriceItem[];
    updated[index] = { ...updated[index], [field]: value };
    setPrices(updated);
  };

  const handleAddPrice = () => {
    setPrices([
      ...prices,
      { type: 'Loại xe mới', price: '0', sub: 'VNĐ / Giờ' },
    ]);
  };

  const handleDeletePrice = (index: number) => {
    if (prices.length <= 1) {
      flashToast('Phải giữ ít nhất 1 chính sách giá');
      return;
    }
    if (!window.confirm('Xóa chính sách giá này?')) return;
    setPrices(prices.filter((_: PriceItem, i: number) => i !== index));
  };

  const handleSavePricing = async () => {
    const cleaned = (prices as PriceItem[])
      .map((p) => ({
        type: (p.type || '').trim(),
        price: (p.price || '').trim(),
        sub: (p.sub || 'VNĐ / Giờ').trim(),
      }))
      .filter((p) => p.type && p.price);

    if (cleaned.length === 0) {
      flashToast('Vui lòng nhập ít nhất 1 chính sách giá hợp lệ');
      return;
    }

    const ok = await savePricing(cleaned);
    flashToast(ok ? 'Đã lưu chính sách giá vào hệ thống' : 'Lưu bảng giá thất bại — kiểm tra API / đăng nhập lại');
  };

  const handleRegulationChange = (index: number, newValue: string) => {
    const updated = [...regulations];
    updated[index] = newValue;
    setRegulations(updated);
  };

  const handleAddRegulation = () => {
    setRegulations([...regulations, 'Quy định mới...']);
  };

  const handleDeleteRegulation = (index: number) => {
    if (regulations.length <= 1) {
      flashToast('Phải giữ ít nhất 1 quy định');
      return;
    }
    if (!window.confirm('Xóa quy định này?')) return;
    setRegulations(regulations.filter((_, i) => i !== index));
  };

  const handleSaveRegulations = async () => {
    const cleaned = regulations.map((r) => r.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      flashToast('Vui lòng nhập ít nhất 1 quy định');
      return;
    }
    await saveRegulations(cleaned);
    flashToast('Đã lưu quy định');
  };

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: Globe },
    { id: 'parking', label: 'Cấu hình Bãi xe', icon: Car },
  ];

  return (
    <AdminLayout>
      <div className="p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {'Cài đặt Hệ thống'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {'Quản lý cấu hình vận hành, bảo mật và tích hợp IoT của PM System.'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-72 shrink-0">
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden p-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm transition-all duration-300
                      ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold scale-[1.02]'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                      }`}
                  >
                    <tab.icon
                      className={`w-4.5 h-4.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-8">
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 p-8 md:p-10">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">
                      {'Thông tin Cơ sở'}
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            {'Tên Bãi đỗ xe'}
                          </label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                            defaultValue="PM System Central Tower"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            {'Mã cơ sở (ID)'}
                          </label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none"
                            defaultValue="PI-CT-001"
                            disabled
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          {'Địa chỉ vận hành'}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                          defaultValue="Số 123, Đường Lê Lợi, Quận 1, TP. HCM"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            {'Múi giờ'}
                          </label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none">
                            <option>GMT +7 (Hanoi, Bangkok)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            {'Ngôn ngữ mặc định'}
                          </label>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none"
                            disabled
                          >
                            <option>{'Tiếng Việt'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'parking' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  {/* Pricing CRUD */}
                  <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 p-8 md:p-10">
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {'Chính sách Giá gửi xe'}
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddPrice}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm giá
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {(prices as PriceItem[]).map((p, i) => (
                        <div
                          key={i}
                          className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-200/80 hover:bg-white hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden"
                        >
                          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

                          <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                            <input
                              type="text"
                              className="flex-1 min-w-0 bg-transparent text-[11px] font-black text-slate-500 uppercase tracking-widest border-none p-0 focus:ring-0 outline-none placeholder:text-slate-300"
                              value={p.type}
                              placeholder="Loại xe"
                              onChange={(e) => handlePriceFieldChange(i, 'type', e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeletePrice(i)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="relative z-10">
                            <input
                              type="text"
                              className="w-full bg-transparent text-3xl font-black text-blue-600 border-none p-0 focus:ring-0 outline-none placeholder-blue-600/30"
                              value={p.price}
                              placeholder="0"
                              onChange={(e) => handlePriceFieldChange(i, 'price', e.target.value)}
                            />
                          </div>

                          <select
                            className="relative z-10 mt-2 w-full bg-transparent text-[11px] font-bold text-slate-400 border-none p-0 focus:ring-0 outline-none cursor-pointer"
                            value={SUB_OPTIONS.includes(p.sub) ? p.sub : p.sub}
                            onChange={(e) => handlePriceFieldChange(i, 'sub', e.target.value)}
                          >
                            {!SUB_OPTIONS.includes(p.sub) && p.sub && (
                              <option value={p.sub}>{p.sub}</option>
                            )}
                            {SUB_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleSavePricing()}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">save</span>
                        {'Lưu chính sách giá'}
                      </button>
                    </div>
                  </div>

                  {/* Regulations CRUD */}
                  <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 p-8 md:p-10">
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {'Quy định & Nội quy Bãi xe'}
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddRegulation}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm quy định
                      </button>
                    </div>

                    <div className="space-y-4">
                      {regulations.map((r: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-3 items-center bg-slate-50/80 p-4 sm:p-5 rounded-[1.5rem] border border-slate-200/80 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 hover:border-blue-300 transition-all shadow-sm"
                        >
                          <span className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                            {i + 1}
                          </span>
                          <input
                            type="text"
                            className="flex-1 min-w-0 bg-transparent font-semibold text-slate-700 border-none p-0 focus:ring-0 outline-none text-[13px]"
                            value={r}
                            placeholder="Nhập nội dung quy định..."
                            onChange={(e) => handleRegulationChange(i, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteRegulation(i)}
                            className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            title="Xóa quy định"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleSaveRegulations()}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">save</span>
                        {'Lưu quy định'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-10 right-10 z-[9999] bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl flex items-center gap-4 max-w-sm"
        >
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-black tracking-tight mb-0.5">{toastMsg}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {'Thông tin đã được cập nhật'}
            </p>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
