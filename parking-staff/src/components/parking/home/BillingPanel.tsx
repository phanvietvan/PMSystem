import React from 'react';
import { playChimeSound } from '../../../utils/audio';

interface BillingPanelProps {
  gateMode: 'ENTRY' | 'EXIT';
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  scannedResult: any;
  extraFees: any[];
  setExtraFees: (fees: any[]) => void;
  isAddingSurcharge: boolean;
  setIsAddingSurcharge: (val: boolean) => void;
  surchargeDraft: any;
  setSurchargeDraft: (draft: any) => void;
  confirmPass: () => void;
}

const BillingPanel: React.FC<BillingPanelProps> = ({
  gateMode,
  gateState,
  scannedResult,
  extraFees,
  setExtraFees,
  isAddingSurcharge,
  setIsAddingSurcharge,
  surchargeDraft,
  setSurchargeDraft,
  confirmPass,
}) => {
  return (
    <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col gap-5 relative z-10 flex-1">
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">THÔNG TIN THU PHÍ</span>
        </div>
        {gateMode === 'EXIT' && (
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
            CHỜ THANH TOÁN
          </span>
        )}
      </div>

      {gateMode === 'ENTRY' ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">payments</span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Không thu phí tại
            <br />
            chiều vào
          </p>
        </div>
      ) : gateState === 'COMPARING' && scannedResult ? (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng phí</span>
              <span className="text-sm font-black text-slate-700">{(scannedResult.fee || 0).toLocaleString()} ₫</span>
            </div>
            <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
              <span className="text-xs font-bold text-amber-600/80 uppercase tracking-widest">Đã cọc (App)</span>
              <span className="text-sm font-black text-amber-600">
                -{(scannedResult.depositFee || 0).toLocaleString()} ₫
              </span>
            </div>

            {extraFees.map((fee) => (
              <div
                key={fee.id}
                className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50"
              >
                <span
                  className="text-xs font-bold text-indigo-600/80 uppercase tracking-widest max-w-[120px] truncate"
                  title={fee.name}
                >
                  {fee.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-indigo-600">+{fee.amount.toLocaleString()} ₫</span>
                  <button
                    onClick={() => setExtraFees(extraFees.filter((f) => f.id !== fee.id))}
                    className="text-indigo-300 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))}

            {isAddingSurcharge ? (
              <div className="bg-white p-3 rounded-[1rem] border border-slate-200 shadow-sm flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  placeholder="Tên phụ thu (VD: Quá giờ)"
                  value={surchargeDraft.name}
                  onChange={(e) => setSurchargeDraft({ ...surchargeDraft, name: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 w-0 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    placeholder="Số tiền (VNĐ)"
                    value={surchargeDraft.amount}
                    onChange={(e) => setSurchargeDraft({ ...surchargeDraft, amount: e.target.value })}
                  />
                  <button
                    onClick={() => {
                      const amt = parseInt(surchargeDraft.amount) || 0;
                      if (amt > 0) {
                        setExtraFees([
                          ...extraFees,
                          { id: Math.random().toString(), name: surchargeDraft.name || 'Phụ thu khác', amount: amt },
                        ]);
                        setIsAddingSurcharge(false);
                        setSurchargeDraft({ name: 'Phụ thu khác', amount: '' });
                      } else {
                        setIsAddingSurcharge(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsAddingSurcharge(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSurcharge(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-slate-100 text-blue-600 p-2.5 rounded-xl border border-dashed border-slate-200 transition-colors text-[10px] font-black tracking-widest uppercase cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                THÊM PHỤ THU
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            {(() => {
              const extraFeesTotal = extraFees.reduce((sum, f) => sum + f.amount, 0);
              const netPayable = Math.max(0, (scannedResult.fee || 0) - (scannedResult.depositFee || 0) + extraFeesTotal);
              return (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cần thanh toán</span>
                    <span className={`text-3xl font-black tracking-tighter ${netPayable === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                      {netPayable.toLocaleString()} <span className="text-lg">₫</span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      playChimeSound();
                      confirmPass();
                    }}
                    className={`w-full text-white rounded-xl py-4 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer font-bold uppercase text-sm tracking-wider ${
                      netPayable === 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_-5px_rgba(225,29,72,0.4)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {netPayable === 0 ? 'check_circle' : 'price_check'}
                    </span>
                    {netPayable === 0 ? 'Đã Thanh Toán & Mở Cổng' : 'Đã Thu Tiền & Mở Cổng'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">qr_code_scanner</span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Đang chờ quét
            <br />
            xe ra...
          </p>
        </div>
      )}
    </div>
  );
};

export default BillingPanel;
