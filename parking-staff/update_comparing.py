import re

with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the main container styling
content = content.replace(
    '<div className="flex-1 flex flex-col bg-white text-slate-800 animate-scale-up">',
    '<div className="flex-1 flex flex-col bg-white/95 backdrop-blur-2xl text-slate-800 animate-scale-up relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/60 before:to-transparent before:-z-10 z-10">\n                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-90 shadow-[0_2px_15px_rgba(59,130,246,0.5)] z-20"></div>'
)

# Replace the header
old_header = """                  <div className="p-4.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">ĐỐI CHIẾU THÔNG TIN XE</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Xác thực khớp hình dạng xe & biển số</p>
                    </div>

                    <span className={`text-[10px] font-black px-3.5 py-1 rounded-full uppercase border shadow-sm ${
                      scannedResult.type === 'ENTRY' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80'
                    }`}>
                      {scannedResult.type === 'ENTRY' ? 'Lối Vào • Entry' : 'Lối Ra • Exit'}
                    </span>
                  </div>"""

new_header = """                  <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[1.25rem] bg-gradient-to-br from-blue-50 to-blue-100/80 flex items-center justify-center text-blue-600 shadow-[inset_0_2px_5px_rgba(255,255,255,1)] border border-blue-200/50">
                        <ScanFace size={18} className="drop-shadow-sm" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest drop-shadow-sm">ĐỐI CHIẾU THÔNG TIN XE</h4>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Xác thực khớp hình dạng xe & biển số</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase border shadow-sm ${
                      scannedResult.type === 'ENTRY' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500'
                    }`}>
                      {scannedResult.type === 'ENTRY' ? 'Lối Vào • Entry' : 'Lối Ra • Exit'}
                    </span>
                  </div>"""
content = content.replace(old_header, new_header)

# Replace the EXIT panel
exit_panel_regex = re.compile(
    r'(// EXIT COMPARISON PANEL \(Same premium design system\)\s+<div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch bg-slate-50/50">.*?)(                  {/\* Unified Decision Actions Block \*/})',
    re.DOTALL
)

new_exit_panel = """// EXIT COMPARISON PANEL (Same premium glassmorphic system)
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent">
                      {/* Left: Photos Comparison */}
                      <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh đối chiếu
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            {/* Gate Capture */}
                            <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video">
                              <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">ẢNH HIỆN TẠI</div>
                            </div>
                            
                            {/* Registered Photo */}
                            <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video">
                              {scannedResult.registeredPhoto ? (
                                <img src={scannedResult.registeredPhoto} alt="Entry Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1.5 p-4 text-center">
                                  <span className="material-symbols-outlined text-[32px] text-slate-300">image_not_supported</span>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">ẢNH VÀO LỖI</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/10">ẢNH LÚC VÀO</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Plate Verification & Details */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="shrink-0 bg-gradient-to-b from-white to-slate-50/50 py-3.5 px-4 rounded-[1.25rem] border border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.25em] block mb-2 drop-shadow-sm">BIỂN SỐ XE RA (CÓ THỂ SỬA)</span>
                          <input 
                            type="text" 
                            className="w-full text-[32px] font-mono font-black text-slate-800 text-center tracking-[0.2em] bg-transparent outline-none uppercase leading-none"
                            value={scannedResult.exitPlate || ''}
                            onChange={(e) => setScannedResult({ ...scannedResult, exitPlate: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="py-2 px-3 rounded-[1rem] border border-slate-200/60 bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center flex flex-col justify-center">
                            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] block mb-0.5 text-slate-400">Biển số lúc vào</span>
                            <span className="text-[12px] font-mono font-black block tracking-widest text-slate-700">{scannedResult.plate}</span>
                          </div>
                          
                          <div className={`py-2 px-3 rounded-[1rem] border shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center flex flex-col justify-center transition-colors
                            ${(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 text-blue-700'
                              : 'bg-red-50 border-red-200 text-red-700 animate-pulse'}`}
                          >
                            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] block mb-0.5">Kết quả đối chiếu</span>
                            <span className="text-[11px] font-black block tracking-widest">
                              {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                                ? '✅ TRÙNG KHỚP'
                                : '❌ KHÔNG KHỚP'}
                            </span>
                          </div>
                        </div>

                        {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                          <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 p-3 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] shrink-0">
                            <div className="flex flex-col min-w-0 flex-1 pr-3 text-left">
                              <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Tòa nhà / Bãi đỗ</span>
                              <span className="text-[12px] font-black text-blue-900 block uppercase truncate drop-shadow-sm" title={scannedResult.parkingLotName}>
                                {scannedResult.parkingLotName || 'Khu Vực Vãng Lai'}
                              </span>
                            </div>
                            {scannedResult.parkingSlot && (
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Vị trí đỗ (Ô)</span>
                                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-[0_4px_10px_rgba(59,130,246,0.3)] whitespace-nowrap">
                                  Slot {scannedResult.parkingSlot}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 px-1">
                            <Clock size={14} className="text-blue-500 drop-shadow-sm" /> Thông tin lịch trình
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian vào</span>
                              <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{scannedResult.entryTime || 'N/A'}</span>
                            </div>
                            <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian ra</span>
                              <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{scannedResult.time || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

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
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Mã QR đặt chỗ:</span>
                                <span className="text-[9px] font-mono font-black text-blue-700 block text-right">{scannedResult.qrCode}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="shrink-0 bg-gradient-to-br from-blue-50 to-blue-100/50 py-2.5 px-4 rounded-[1.25rem] border border-blue-200/60 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] mt-auto">
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.15em]">Phí thanh toán ({scannedResult.ticketType.split(' • ')[0]})</span>
                          <span className="text-[16px] font-black text-blue-800 tracking-wider drop-shadow-sm">
                            {(scannedResult.fee || 10000).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    </div>
"""

content = exit_panel_regex.sub(new_exit_panel + r"\2", content)

with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
