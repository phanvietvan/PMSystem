import React from 'react';
import { FileText, Camera, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogDetailsModalProps {
  selectedLogEntry: any;
  onClose: () => void;
  setSelectedLogPhoto: (photo: string | null) => void;
  FALLBACK_CAR_CAPTURES: string[];
}

const LogDetailsModal: React.FC<LogDetailsModalProps> = ({
  selectedLogEntry,
  onClose,
  setSelectedLogPhoto,
  FALLBACK_CAR_CAPTURES,
}) => {
  if (!selectedLogEntry) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-50/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl max-w-4xl w-full relative p-6 md:p-8 text-slate-800 overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 opacity-90"></div>

        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-slate-200/60 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 relative shadow-sm">
              <FileText size={20} />
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-blue-400 border-2 border-white"></span>
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900">
                Chi tiết lượt xe {selectedLogEntry.type === 'ENTRY' ? 'vào' : 'ra'}
              </h3>
              <p className="text-xs font-bold text-blue-600 tracking-wider mt-1">
                {selectedLogEntry.type === 'EXIT'
                  ? `Vào: ${selectedLogEntry.entryTimeStr} • Ra: ${selectedLogEntry.time}`
                  : selectedLogEntry.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center border border-slate-200 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          {/* Left Column: Photos & QR */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex flex-col gap-4 shadow-sm">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 px-1">
                <Camera size={16} /> ẢNH NHẬN DIỆN
              </span>
              <div className="flex flex-col gap-4">
                {selectedLogEntry.type === 'EXIT' && (
                  <div
                    className="rounded-[1.5rem] overflow-hidden relative bg-slate-100 group aspect-video cursor-pointer"
                    onClick={() => setSelectedLogPhoto(selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1])}
                  >
                    <img
                      src={selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1]}
                      alt="Entry Photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-blue-500 px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-widest shadow-sm">
                      ẢNH VÀO
                    </div>
                  </div>
                )}
                <div
                  className="rounded-[1.5rem] overflow-hidden relative bg-slate-100 group aspect-video cursor-pointer"
                  onClick={() =>
                    setSelectedLogPhoto(
                      selectedLogEntry.type === 'EXIT'
                        ? selectedLogEntry.exitPhoto || selectedLogEntry.photo
                        : selectedLogEntry.photo
                    )
                  }
                >
                  <img
                    src={
                      selectedLogEntry.type === 'EXIT'
                        ? selectedLogEntry.exitPhoto || selectedLogEntry.photo
                        : selectedLogEntry.photo
                    }
                    alt="Action Photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 bg-blue-500 px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-widest shadow-sm">
                    ẢNH {selectedLogEntry.type === 'EXIT' ? 'RA' : 'VÀO'}
                  </div>
                </div>
              </div>
            </div>

            {selectedLogEntry.qrCode && (
              <div className="bg-white py-3 px-4 rounded-full border border-slate-100 flex items-center justify-between shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  MÃ QUÉT (QR)
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  {selectedLogEntry.qrCode}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Information */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Plate Display */}
            <div className="bg-white py-6 px-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-2">
                BIỂN SỐ NHẬN DIỆN
              </span>
              <span className="text-4xl font-mono font-black tracking-[0.25em] text-slate-800 leading-none block">
                {selectedLogEntry.plate}
              </span>
            </div>

            {/* Customer Type & Ticket Status */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`py-4 px-3 rounded-[1.5rem] border shadow-sm flex flex-col justify-center text-center ${
                  selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                    selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-500' : 'text-slate-400'
                  }`}
                >
                  LOẠI KHÁCH
                </span>
                <span
                  className={`text-[12px] font-black block tracking-widest ${
                    selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {selectedLogEntry.owner}
                </span>
              </div>
              <div className="bg-white py-4 px-3 rounded-[1.5rem] border border-slate-100 shadow-sm text-center flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                  TRẠNG THÁI VÉ
                </span>
                <span className="text-[12px] font-black text-slate-700 block tracking-widest">
                  {selectedLogEntry.ticketType}
                </span>
              </div>
            </div>

            {/* Location Info */}
            {(selectedLogEntry.parkingLotName || selectedLogEntry.parkingSlot) && (
              <div className="bg-blue-50/50 p-4 rounded-[1.5rem] border border-blue-100/50 flex items-center justify-between shadow-sm">
                <div className="flex flex-col min-w-0 flex-1 text-left">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">
                    TÒA NHÀ / BÃI ĐỖ
                  </span>
                  <span className="text-sm font-black text-slate-800 block uppercase truncate">
                    {selectedLogEntry.parkingLotName || 'Khu Vực Vãng Lai'}
                  </span>
                </div>
                {selectedLogEntry.parkingSlot && (
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">
                      VỊ TRÍ ĐỖ (Ô)
                    </span>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                      Slot {selectedLogEntry.parkingSlot}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Info */}
            <div
              className={`bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm ${
                selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'shrink-0' : 'flex-1'
              }`}
            >
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                <Clock size={16} /> THÔNG TIN LỊCH TRÌNH
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white py-3 px-2 rounded-full border border-slate-100 text-center flex flex-col justify-center shadow-sm col-span-2 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                    THỜI GIAN VÀO
                  </span>
                  <span className="text-sm font-black text-slate-800 block">{selectedLogEntry.entryTimeStr}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedLogEntry.entryDateStr}</span>
                </div>
                {selectedLogEntry.type === 'EXIT' && (
                  <div className="bg-white py-3 px-2 rounded-full border border-slate-100 text-center flex flex-col justify-center shadow-sm col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                      THỜI GIAN RA
                    </span>
                    <span className="text-sm font-black text-slate-800 block">{selectedLogEntry.exitTimeStr}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedLogEntry.exitDateStr}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details */}
            {selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' && selectedLogEntry.customerName && (
              <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm flex flex-col gap-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 px-1">
                  <User size={16} /> KHÁCH HÀNG
                </span>
                <div className="px-1 flex flex-col gap-3">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">
                      TÊN:
                    </span>
                    <span className="text-xs font-bold text-slate-800 block truncate text-right">
                      {selectedLogEntry.customerName}
                    </span>
                  </div>
                  <div className="w-full border-t border-slate-100 border-dashed"></div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">
                      SĐT:
                    </span>
                    <span className="text-xs font-bold text-slate-800 block text-right">
                      {selectedLogEntry.customerPhone || 'N/A'}
                    </span>
                  </div>
                  <div className="w-full border-t border-slate-100 border-dashed"></div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">
                      EMAIL:
                    </span>
                    <span className="text-xs font-bold text-slate-800 block truncate text-right">
                      {selectedLogEntry.customerEmail || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Fee for Exit */}
            {selectedLogEntry.type === 'EXIT' && selectedLogEntry.totalFee !== undefined && (
              <div className="shrink-0 bg-blue-50 py-4 px-6 rounded-[1.5rem] border border-blue-100 flex items-center justify-between shadow-sm mt-auto">
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Phí thanh toán</span>
                <span className="text-xl font-black text-blue-700 tracking-wide">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    selectedLogEntry.totalFee
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LogDetailsModal;
