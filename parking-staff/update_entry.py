import re

with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the ENTRY panel
entry_panel_regex = re.compile(
    r'(// ENTRY CONFIRMATION PANEL with editable input box\s+<div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch bg-slate-50/50">.*?)(                  \) : \(\s+// EXIT COMPARISON PANEL \(Same premium glassmorphic system\))',
    re.DOTALL
)

new_entry_panel = """// ENTRY CONFIRMATION PANEL with editable input box
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent">
                      {/* Left: Captured camera photo */}
                      <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh Nhận Diện
                            </span>
                          </div>
                          <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 flex-1 min-h-[220px]">
                            <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">CAMERA VÀO</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Large Editable Plate Field */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="shrink-0 bg-gradient-to-b from-white to-slate-50/50 py-3.5 px-4 rounded-[1.25rem] border border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.25em] block mb-2 drop-shadow-sm">BIỂN SỐ NHẬN DIỆN (CÓ THỂ SỬA)</span>
                          <input 
                            type="text" 
                            className="w-full text-[32px] font-mono font-black text-slate-800 text-center tracking-[0.2em] bg-transparent outline-none uppercase leading-none"
                            value={scannedResult.plate}
                            onChange={(e) => setScannedResult({ ...scannedResult, plate: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 py-2 px-3 rounded-[1rem] border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase shrink-0 pr-2">Vé:</span>
                            <span className="text-[11px] font-black text-blue-700 tracking-widest truncate">{scannedResult.ticketType.split(' • ')[0]}</span>
                          </div>

                          {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                            <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 px-3 py-2 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_2px_10px_rgba(59,130,246,0.05)]">
                              <span className="text-[8px] text-blue-500 font-extrabold uppercase shrink-0 pr-2">Bãi đỗ:</span>
                              <span className="text-[11px] font-black text-blue-900 truncate tracking-widest">{scannedResult.parkingLotName}</span>
                            </div>
                          )}
                        </div>

                        {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                          <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 p-3 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] shrink-0">
                            <span className="text-[8px] text-blue-500 font-extrabold uppercase shrink-0">Vị trí đỗ:</span>
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-[0_4px_10px_rgba(59,130,246,0.3)] whitespace-nowrap">Slot {scannedResult.parkingSlot}</span>
                          </div>
                        )}

                        {scannedResult.userInfo && (
                          <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-2 h-full min-h-0">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              <User size={14} className="text-blue-500 drop-shadow-sm" /> Khách hàng
                            </span>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100/80 flex flex-col gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.01)] flex-1 justify-center min-h-0 overflow-y-auto custom-scrollbar">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Tên:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">SĐT:</span>
                                <span className="text-[10px] font-bold text-slate-800 block text-right">{scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Email:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Mã QR đặt chỗ:</span>
                                <span className="text-[9px] font-mono font-black text-blue-700 block text-right">{scannedResult.qrCode}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>"""

if entry_panel_regex.search(content):
    content = entry_panel_regex.sub(new_entry_panel + r"\2", content)
    with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("ENTRY panel replaced successfully.")
else:
    print("ENTRY panel regex did not match.")
