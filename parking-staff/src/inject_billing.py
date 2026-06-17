import sys

path = r'c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx'

billing_box = """
            {/* Billing / Fee Calculation Panel */}
            <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col gap-5 relative z-10 flex-1">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">THÔNG TIN THU PHÍ</span>
                </div>
                {gateMode === 'EXIT' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">CHỜ THANH TOÁN</span>}
              </div>

              {gateMode === 'ENTRY' ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">payments</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Không thu phí tại<br/>chiều vào</p>
                </div>
              ) : (
                gateState === 'COMPARING' && scannedResult ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng phí</span>
                        <span className="text-sm font-black text-slate-700">{(scannedResult.fee || 0).toLocaleString()} ₫</span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                        <span className="text-xs font-bold text-amber-600/80 uppercase tracking-widest">Đã cọc (App)</span>
                        <span className="text-sm font-black text-amber-600">-{(scannedResult.depositFee || 0).toLocaleString()} ₫</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Cần thanh toán</span>
                        <span className="text-3xl font-black text-rose-600 tracking-tighter">
                          {Math.max(0, (scannedResult.fee || 0) - (scannedResult.depositFee || 0)).toLocaleString()} <span className="text-lg">₫</span>
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          playChimeSound();
                          handleApprove();
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-4 flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(225,29,72,0.4)] active:scale-95 transition-all cursor-pointer font-bold uppercase text-sm tracking-wider"
                      >
                        <span className="material-symbols-outlined text-lg">price_check</span>
                        Đã Thu Tiền & Mở Cổng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">qr_code_scanner</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Đang chờ quét<br/>xe ra...</p>
                  </div>
                )
              )}
            </div>
"""

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''                <span className="text-[11px] font-bold uppercase">MỞ CỔNG THỦ CÔNG [F8]</span>
              </button>

            </div>

            
          </div>'''

replacement = '''                <span className="text-[11px] font-bold uppercase">MỞ CỔNG THỦ CÔNG [F8]</span>
              </button>

            </div>''' + billing_box + '''
            
          </div>'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
