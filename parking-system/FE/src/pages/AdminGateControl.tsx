import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  QrCode, 
  ArrowRightLeft, 
  ShieldCheck, 
  Car, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  FileKey2
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';
import { parseLicensePlate } from '../utils/auth';

const AdminGateControl = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');
  const [qrInput, setQrInput] = useState('');
  const [exitPlateInput, setExitPlateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [barrierState, setBarrierState] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string; details?: string } | null>(null);

  const handleEntryCheckIn = async (qr: string) => {
    setLoading(true);
    setResultMessage(null);
    try {
      const resp = await api.post('/ParkingSessions/gate-scan', { qrCode: qr.trim().toUpperCase() });
      setBarrierState('opening');
      setResultMessage({
        type: 'success',
        text: 'XÁC THỰC LỐI VÀO THÀNH CÔNG',
        details: `Xe biển số ${parseLicensePlate(resp.data?.licensePlate || '')} đã check-in vào Ô ${resp.data?.parkingSlot || 'A3'}. Barrier đang mở!`
      });
      setTimeout(() => setBarrierState('opened'), 1500);
      setQrInput('');
    } catch (err: any) {
      console.error(err);
      setResultMessage({
        type: 'error',
        text: 'LỖI XÁC THỰC CỔNG VÀO',
        details: err.response?.data?.message || 'Mã QR không hợp lệ, đã hết hạn hoặc đã được check-in trước đó.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExitCheckOut = async (qr: string, plate: string) => {
    if (!plate.trim()) {
      setResultMessage({
        type: 'warning',
        text: 'THIẾU BIỂN SỐ XE LỐI RA',
        details: 'Vui lòng nhập biển số xe thực tế ghi nhận tại cổng ra để đối chiếu AI.'
      });
      return;
    }
    setLoading(true);
    setResultMessage(null);
    try {
      const resp = await api.post('/ParkingSessions/checkout', { 
        qrCode: qr.trim().toUpperCase(),
        exitLicensePlate: plate.trim().toUpperCase(),
        exitPhoto: ''
      });
      setBarrierState('opening');
      const isMatched = resp.data?.isPlateMatched;
      setResultMessage({
        type: isMatched ? 'success' : 'warning',
        text: isMatched ? 'XÁC THỰC LỐI RA THÀNH CÔNG' : 'CẢNH BÁO: KHÔNG TRÙNG KHỚP BIỂN SỐ',
        details: `${resp.data?.message} - Phí đỗ xe: ${Number(resp.data?.fee || 0).toLocaleString('vi-VN')} VNĐ.`
      });
      setTimeout(() => setBarrierState('opened'), 1500);
      setQrInput('');
      setExitPlateInput('');
    } catch (err: any) {
      console.error(err);
      setResultMessage({
        type: 'error',
        text: 'LỖI XÁC THỰC CỔNG RA',
        details: err.response?.data?.message || 'Không tìm thấy phiên gửi xe hoạt động cho mã QR này.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetBarrier = () => {
    setBarrierState('closed');
    setResultMessage(null);
  };

  return (
    <AdminLayout searchPlaceholder="Tìm kiếm mã phiên cổng kiểm soát...">
      <div className="p-10 space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Cổng Kiểm Soát Staff</h2>
            <p className="text-sm text-slate-500 font-medium">Bảng mô phỏng quét mã QR & camera đối chiếu biển số dành cho bảo vệ tại bốt.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setActiveTab('entry'); resetBarrier(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'entry' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Car className="w-4 h-4" />
              CỔNG VÀO (Entry)
            </button>
            <button
              onClick={() => { setActiveTab('exit'); resetBarrier(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'exit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              CỔNG RA (Exit)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left panel: Simulator camera scan */}
          <div className="col-span-12 md:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-600" />
              Camera quét mã QR bốt bảo vệ
            </h3>

            {/* Simulated Scanner Viewfinder */}
            <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-10 border-2 border-dashed border-blue-500/40 rounded-xl flex items-center justify-center">
                <QrCode className={`w-28 h-28 ${loading ? 'text-blue-500 animate-pulse' : 'text-slate-700'} transition-colors`} />
                
                {/* Scanner laser beam animation */}
                <motion.div 
                  animate={{ y: [-80, 80, -80] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] z-10"
                />
              </div>

              {/* Barrier state overlays */}
              <AnimatePresence>
                {barrierState !== 'closed' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
                  >
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 ${barrierState === 'opening' ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
                    >
                      {barrierState === 'opening' ? <Loader2 className="w-8 h-8 font-black" /> : <CheckCircle2 className="w-8 h-8" />}
                    </motion.div>
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">
                      {barrierState === 'opening' ? 'ĐANG MỞ CỔNG BARRIER...' : 'BARRIER ĐANG MỞ'}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">Xe có thể di chuyển qua bốt</p>
                    {barrierState === 'opened' && (
                      <button 
                        onClick={resetBarrier}
                        className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-black text-white rounded-xl transition-all uppercase tracking-widest border border-slate-700"
                      >
                        Đóng barrier
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick manual form inputs */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nhập mã QR thủ công (MÃ SỐ PHIÊN)</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <FileKey2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="VD: QR_5F92A..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {activeTab === 'exit' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nhập biển số xe thực tế cổng ra (AI đối chiếu)</label>
                  <input
                    type="text"
                    value={exitPlateInput}
                    onChange={(e) => setExitPlateInput(e.target.value)}
                    placeholder="VD: 51F-123.45"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
              )}

              <button
                onClick={() => activeTab === 'entry' ? handleEntryCheckIn(qrInput) : handleExitCheckOut(qrInput, exitPlateInput)}
                disabled={loading || !qrInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {activeTab === 'entry' ? 'Xác nhận quét cho xe vào' : 'Xác nhận quét cho xe ra'}
              </button>
            </div>
          </div>

          {/* Right panel: Active/Pending list & Status Output */}
          <div className="col-span-12 md:col-span-5 space-y-6">
            {/* Feedback Alerts */}
            <AnimatePresence mode="wait">
              {resultMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-6 rounded-3xl border flex items-start gap-4 shadow-sm ${
                    resultMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : resultMessage.type === 'warning'
                      ? 'bg-amber-50 border-amber-100 text-amber-800'
                      : 'bg-red-50 border-red-100 text-red-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl text-white flex-shrink-0 ${
                    resultMessage.type === 'success' ? 'bg-emerald-500' : resultMessage.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {resultMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">{resultMessage.text}</h4>
                    <p className="text-xs font-bold mt-1.5 leading-relaxed opacity-90">{resultMessage.details}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Simulation Help Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Hướng dẫn mô phỏng bốt
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Để kiểm tra quy trình, bạn hãy sao chép **MÃ SỐ PHIÊN** (QR Code) được hiển thị trên trang thành công hoặc lịch đỗ xe của khách hàng rồi dán vào ô nhập mã trên đây:
              </p>
              <ul className="text-[11px] text-slate-500 font-medium space-y-2 list-disc list-inside">
                <li>**Cổng Vào:** Quét mã QR để cho phép khách hàng check-in, đổi trạng thái sang *"Đang giám sát"* và bắt đầu đếm thời gian đỗ.</li>
                <li>**Cổng Ra:** Quét mã QR + Nhập biển số đối chiếu để hoàn tất phiên đỗ xe, trả tự do cho vị trí đỗ.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGateControl;
