import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportLogData: any;
  reportPlate: string;
  setReportPlate: (plate: string) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  handleReportVehicle: (e: React.FormEvent) => void;
  FALLBACK_CAR_CAPTURES: string[];
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportLogData,
  reportPlate,
  setReportPlate,
  reportReason,
  setReportReason,
  handleReportVehicle,
  FALLBACK_CAR_CAPTURES,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50 border border-slate-100"
      >
        <div className="flex items-center gap-3 mb-5 text-red-600">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-black text-slate-800">Báo cáo xe vi phạm</h3>
        </div>

        {/* Full Information Display */}
        {reportLogData && (
          <div className="mb-5 bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-inner">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm bg-slate-200">
                <img
                  src={reportLogData.photo || FALLBACK_CAR_CAPTURES[0]}
                  alt="Xe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-widest">
                  {reportLogData.plate}
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1 truncate">
                  {reportLogData.customerName || 'KHÁCH VÃNG LAI'}
                </p>
                {reportLogData.customerPhone && (
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{reportLogData.customerPhone}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Loại vé / Trạng thái
                </p>
                <p className="text-[11px] font-bold text-slate-700">{reportLogData.ticketType || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Khu vực / Slot
                </p>
                <p className="text-[11px] font-bold text-slate-700 truncate">
                  {reportLogData.parkingLotName || 'Chung'} • {reportLogData.parkingSlot || '--'}
                </p>
              </div>
              {reportLogData.owner === 'KHÁCH ĐẶT TRƯỚC' && (
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Thời gian đặt chỗ
                  </p>
                  <p className="text-[11px] font-bold text-blue-600 truncate">
                    {reportLogData.createdTimeStr || 'N/A'} {reportLogData.createdDateStr || ''}
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Thời gian vào
                </p>
                <p className="text-[11px] font-bold text-emerald-600 truncate">
                  {reportLogData.entryTimeStr || 'Chưa vào'} {reportLogData.entryDateStr || ''}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Thời gian ra
                </p>
                <p className="text-[11px] font-bold text-rose-600 truncate">
                  {reportLogData.exitTimeStr || 'Chưa ra'} {reportLogData.exitDateStr || ''}
                </p>
              </div>
              {reportLogData.totalFee != null && (
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Tổng phí
                  </p>
                  <p className="text-[11px] font-bold text-amber-600 truncate">
                    {reportLogData.totalFee.toLocaleString()} ₫
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleReportVehicle} className="space-y-4">
          {!reportLogData && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Biển số xe
              </label>
              <input
                type="text"
                required
                value={reportPlate}
                onChange={(e) => setReportPlate(e.target.value)}
                placeholder="VD: 51A-123.45"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm bg-white uppercase"
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Lý do vi phạm
            </label>
            <textarea
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Nhập chi tiết lý do (đỗ sai quy định, gây rối, vv...)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm bg-white resize-none"
            />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md"
            >
              Gửi Báo Cáo
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
};

export default ReportModal;
