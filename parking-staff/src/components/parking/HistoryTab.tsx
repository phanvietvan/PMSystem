import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

interface HistoryTabProps {
  recentLogs: any[];
  setSelectedLogEntry: (log: any) => void;
  setSelectedLogPhoto: (photo: string | null) => void;
  setReportPlate: (plate: string) => void;
  setReportLogData: (log: any) => void;
  setShowReportModal: (show: boolean) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  recentLogs,
  setSelectedLogEntry,
  setSelectedLogPhoto,
  setReportPlate,
  setReportLogData,
  setShowReportModal,
}) => {
  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 overflow-hidden flex flex-col animate-fade-in">
      <div className="bg-white/75 backdrop-blur-2xl rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden h-[85vh]">
        <div className="p-5 border-b border-slate-200/30 flex justify-between items-center shrink-0 bg-white/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">LỊCH SỬ</span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">LIVE MONGO</span>
        </div>

        {/* MongoDB Log rows */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar">
          {recentLogs.length > 0 ? (
            recentLogs.map((log, i) => (
              <div
                key={i}
                onClick={() => setSelectedLogEntry(log)}
                className="bg-white/60 p-4 rounded-[1.25rem] flex flex-col md:flex-row items-start md:items-center gap-5 border border-white/80 hover:bg-white transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] group"
              >
                {/* 1. Photo & Plate */}
                <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
                  <div
                    className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner ring-1 ring-slate-200/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogPhoto(log.photo);
                    }}
                  >
                    <img
                      src={log.photo}
                      alt="Thumb"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-800 tracking-wide uppercase">{log.plate}</span>
                      {log.type === 'ENTRY' ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Đang trong bãi"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" title="Đã ra khỏi bãi"></span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                          log.owner === 'KHÁCH ĐẶT TRƯỚC'
                            ? 'bg-blue-100/50 text-blue-600 border border-blue-200/50'
                            : 'bg-slate-200/50 text-slate-500 border border-slate-300/50'
                        }`}
                      >
                        {log.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'ĐẶT TRƯỚC' : 'VÃNG LAI'}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                          log.type === 'ENTRY'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50'
                            : log.type === 'EXIT'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : log.type === 'PENDING'
                            ? 'bg-amber-50 text-amber-600 border-amber-200/50'
                            : log.type === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-600 border-rose-200/50'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {log.type === 'ENTRY'
                          ? 'XE VÀO'
                          : log.type === 'EXIT'
                          ? 'XE RA'
                          : log.type === 'PENDING'
                          ? 'CHƯA VÀO'
                          : log.type === 'CANCELLED'
                          ? 'ĐÃ HỦY'
                          : 'BÁO ĐỘNG'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Info */}
                <div className="flex flex-col gap-1 w-full md:w-[220px] shrink-0 border-l border-slate-100 pl-5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">
                      {log.customerName || 'KHÁCH VÃNG LAI'}
                    </span>
                  </div>
                  {log.customerPhone && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                      <span className="text-[11px] font-semibold text-slate-500">{log.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-blue-400">pin_drop</span>
                    <span className="text-[10px] font-bold text-blue-600 truncate">
                      {log.parkingLotName || 'Khu Vực Chung'} • Slot {log.parkingSlot || '--'}
                    </span>
                  </div>
                </div>

                {/* 3. Time Info */}
                <div className="flex flex-col gap-2 w-full md:flex-1 border-l border-slate-100 pl-5">
                  {log.owner === 'KHÁCH ĐẶT TRƯỚC' && (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          THỜI GIAN ĐẶT
                        </span>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                          <span className="text-xs font-bold">{log.createdTimeStr}</span>
                          <span className="text-[10px] text-blue-400">{log.createdDateStr}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        THỜI GIAN VÀO
                      </span>
                      {log.isCheckedIn || log.owner === 'KHÁCH VÃNG LAI' ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="material-symbols-outlined text-[14px] text-emerald-500">login</span>
                          <span className="text-xs font-bold">{log.entryTimeStr}</span>
                          <span className="text-[10px] text-slate-500">{log.entryDateStr}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                          <span className="text-[10px] font-semibold italic">Chưa vào bãi</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        THỜI GIAN RA
                      </span>
                      {log.exitTimeStr ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="material-symbols-outlined text-[14px] text-rose-500">logout</span>
                          <span className="text-xs font-bold">{log.exitTimeStr}</span>
                          <span className="text-[10px] text-slate-500">{log.exitDateStr}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                          <span className="text-[10px] font-semibold italic">Chưa ra bãi</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Action / Status */}
                <div className="flex flex-col items-end gap-2 shrink-0 border-l border-slate-100 pl-5 min-w-[120px]">
                  {log.totalFee != null ? (
                    <>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TỔNG PHÍ</span>
                      <span className="text-sm font-black text-amber-600">
                        {log.totalFee.toLocaleString()} ₫
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TRẠNG THÁI</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        {log.ticketType}
                      </span>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportPlate(log.plate);
                      setReportLogData(log);
                      setShowReportModal(true);
                    }}
                    className="mt-auto text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5 border border-red-100 shadow-sm w-full justify-center"
                  >
                    <AlertTriangle size={12} /> Báo cáo
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 gap-2 text-slate-400">
              <Activity size={24} className="text-slate-350 animate-pulse" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Đang hoạt động</p>
              <p className="text-[10px] text-slate-400">Sẵn sàng nhận dữ liệu xe từ MongoDB...</p>
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-3 border-t border-slate-200/30 bg-white/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-blue-600">cloud_done</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">HỆ THỐNG API</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">KẾT NỐI OK</span>
        </div>
      </div>
    </main>
  );
};

export default HistoryTab;
