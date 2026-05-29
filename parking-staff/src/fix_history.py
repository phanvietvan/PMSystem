import sys

path = r'c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx'

history_panel = """            <div className="bg-white/75 backdrop-blur-2xl rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden h-[85vh]">
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
                      className="bg-white/50 p-3 rounded-lg flex items-center gap-4 hover:translate-x-1 transition-transform border border-white/50 cursor-pointer shadow-sm"
                    >
                      <div 
                        className="w-12 h-12 rounded-lg bg-blue-50 overflow-hidden shrink-0 flex items-center justify-center relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogPhoto(log.photo);
                        }}
                      >
                        <img src={log.photo} alt="Thumb" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[16px]">zoom_in</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">{log.plate}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                            log.owner === 'KHÁCH ĐẶT TRƯỚC' 
                              ? 'bg-blue-100/50 text-blue-600' 
                              : 'bg-slate-200/50 text-slate-500'
                          }`}>
                            {log.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'ĐẶT TRƯỚC' : 'VÃNG LAI'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{log.time}</span>
                      </div>

                      <div className={`px-3 py-1 rounded-full border ${
                        log.type === 'ENTRY' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' : 
                        log.type === 'EXIT' ? 'bg-slate-200/50 text-slate-500 border-slate-300/50' : 
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        <span className="text-[10px] font-bold uppercase">{log.type === 'ENTRY' ? 'XE VÀO' : log.type === 'EXIT' ? 'XE RA' : 'BÁO ĐỘNG'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Waiting for MongoDB connection state */
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
            </div>"""

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the empty <main> block for history with the one containing history_panel
content = content.replace('''      ) : (
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 overflow-hidden flex flex-col animate-fade-in">

        </main>
      )}''', f'''      ) : (
        <main className="flex-1 w-full max-w-[1000px] mx-auto p-4 md:p-8 overflow-hidden flex flex-col animate-fade-in">
{history_panel}
        </main>
      )}}''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
