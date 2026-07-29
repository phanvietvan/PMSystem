import { Building2, MapPin, Layers, LayoutGrid, Search, Plus, CarFront, Users, Banknote, ShieldAlert, Navigation, DoorClosed, DoorOpen } from 'lucide-react';
import { Trash2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';
import { useAdminReports } from '../hooks/useAdminReports';

const AdminReports = () => {
  const {
    branches,
    loading,
    searchQuery,
    setSearchQuery,
    globalStats,
    monthlyRevenueData,
    searchTerm,
    setSearchTerm,
    toastMessage,
    newLotAddress,
    setNewLotAddress,
    isSearchingLocation,
    searchFeedback,
    newLotFloors,
    setNewLotFloors,
    addressSuggestions,
    showSuggestions,
    setShowSuggestions,
    newLot,
    setNewLot,
    newLotFloorCapacities,
    setNewLotFloorCapacities,
    filteredBranches,
    handleSelectSuggestion,
    handleSearchAddress,
    handleAddLot,
    handleDeleteLot,
    handleAddFloorToLot,
    handleRemoveFloorFromLot,
    handleFloorCapacityChange,
    handleFloorCapacityBlur,
    handleFieldChange,
    handleCoordinatesChange,
    handleFieldBlur,
    handleToggleEntries,
  } = useAdminReports();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <AdminLayout>
          <div className="p-8 md:p-10 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {'Quản lý Chi nhánh & Tòa nhà'}
                </h1>
                <p className="text-sm font-semibold text-slate-500">
                  {'Giám sát sức chứa, hiệu suất và doanh thu của tất cả khu vực.'}
                </p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                <Plus className="w-5 h-5" />
                {'Thêm Tòa nhà mới'}
              </button>
            </div>
    
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 bg-blue-500 group-hover:opacity-20 transition-opacity"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 relative z-10"><Building2 className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 relative z-10">
                    {'TỔNG SỐ'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 relative z-10">
                  {'CHI NHÁNH HOẠT ĐỘNG'}
                </p>
                <div className="text-3xl font-black text-slate-800 tracking-tight relative z-10">{loading ? '-' : branches.length}</div>
              </div>
              
              <div className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 bg-amber-500 group-hover:opacity-20 transition-opacity"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 relative z-10"><CarFront className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-100/50 text-amber-700 relative z-10">
                    {'THỰC TẾ'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 relative z-10">
                  {'SỨC CHỨA / ĐANG ĐỖ'}
                </p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">{loading ? '-' : globalStats.currentOccupancy}</span>
                  <span className="text-sm font-bold text-slate-400">/ {loading ? '-' : globalStats.totalCapacity}</span>
                </div>
              </div>
              
              <div className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 bg-emerald-500 group-hover:opacity-20 transition-opacity"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 relative z-10"><Users className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 relative z-10">
                    {'LŨY KẾ'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 relative z-10">
                  {'TỔNG LƯỢT GIAO DỊCH'}
                </p>
                <div className="text-3xl font-black text-slate-800 tracking-tight relative z-10">{loading ? '-' : globalStats.totalSessions.toLocaleString()} <span className="text-sm font-bold text-slate-400">{'lượt'}</span></div>
              </div>
    
              <div className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 bg-indigo-500 group-hover:opacity-20 transition-opacity"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 relative z-10"><Banknote className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-indigo-100/50 text-indigo-700 relative z-10">
                    {'THỰC TẾ'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 relative z-10">
                  {'TỔNG DOANH THU'}
                </p>
                <div className="text-2xl font-black text-slate-800 tracking-tight relative z-10 line-clamp-1">{loading ? '-' : formatCurrency(globalStats.totalRevenue)}</div>
              </div>
            </div>
    
            {/* Monthly Revenue Chart */}
            <div className="bg-white p-8 md:p-10 rounded-[24px] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative z-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {'Biểu đồ Doanh thu'} {new Date().getFullYear()}
                </h3>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase">
                     {'Doanh thu (VNĐ)'}
                   </span>
                </div>
              </div>
              
              <div className="h-56 md:h-64 flex items-end justify-between px-2 gap-2 md:gap-4">
                {monthlyRevenueData.map((d, i) => {
                  const maxRev = Math.max(...monthlyRevenueData.map(m => m.revenue), 100000);
                  const heightPct = (d.revenue / maxRev) * 100;
                  const isActive = new Date().getMonth() === i;
                  
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative" title={`${'Tháng'} ${i + 1}: ${formatCurrency(d.revenue)}`}>
                       {/* Tooltip */}
                       <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                         {formatCurrency(d.revenue)}
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                       </div>
                       
                       <div className="w-full max-w-[40px] flex-1 flex items-end gap-1.5 min-h-0">
                          <div className={`w-full rounded-t-xl transition-all duration-300 group-hover:scale-y-105 origin-bottom shadow-sm ${isActive ? 'bg-blue-600' : 'bg-blue-100 hover:bg-blue-300'}`} style={{ height: `${heightPct}%` }}></div>
                       </div>
                       <span className={`mt-4 text-[10px] font-black shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
    
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="relative w-full md:w-[400px] group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Search className="text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                     className="w-full bg-white border border-slate-200/60 rounded-full pl-12 pr-6 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" 
                     placeholder={"Tìm kiếm chi nhánh, tòa nhà, địa chỉ..."}
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>
    
            {/* Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {loading ? (
                 Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-[24px] p-6 h-[400px] animate-pulse border border-slate-100"></div>
                 ))
               ) : filteredBranches.map(branch => {
                 const occPct = Math.min((branch.currentOccupancy / (branch.capacity || 1)) * 100, 100);
                 const isFull = branch.currentOccupancy >= (branch.capacity || 1);
                 const accepting = branch.isAcceptingEntries !== false;
                 const statusTone = !accepting ? 'amber' : isFull ? 'red' : 'emerald';
                 
                 return (
                   <div key={branch.id} className={`bg-white rounded-[28px] border shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-400 overflow-hidden flex flex-col group cursor-pointer relative ${!accepting ? 'border-amber-200/80 ring-1 ring-amber-100' : 'border-slate-200/60'}`}>
                     {/* Premium Background Elements */}
                     <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none ${!accepting ? 'bg-gradient-to-br from-amber-50 to-transparent' : 'bg-gradient-to-br from-blue-50 to-transparent'}`}></div>
                     
                     <div className="p-7 border-b border-slate-100/60 relative z-10">
                       <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200/50 shadow-inner">
                               <Building2 className="w-7 h-7 drop-shadow-sm" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{branch.name}</h3>
                              <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                                 <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                 <span className="text-xs font-semibold line-clamp-1">{branch.address || ('Đang cập nhật...')}</span>
                              </div>
                            </div>
                          </div>
                       </div>
    
                       {/* GPS & Tags */}
                       <div className="flex flex-wrap gap-2 mb-6">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 shadow-[inset_0_1px_2px_rgba(255,255,255,1)]">
                             <Navigation className="w-3.5 h-3.5 text-slate-400" />
                             {branch.latitude}, {branch.longitude}
                          </div>
                          {branch.lockedSlots && branch.lockedSlots.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 animate-pulse">
                               <ShieldAlert className="w-3.5 h-3.5" />
                               {branch.lockedSlots.length} {'ô bị khóa'}
                            </div>
                          )}
                          {!accepting && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                               <DoorClosed className="w-3.5 h-3.5" />
                               {'Chỉ cho xe ra'}
                            </div>
                          )}
                       </div>
                       
                       {/* Occupancy Progress Bar */}
                       <div className="mb-2">
                         <div className="flex justify-between items-end mb-2">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                                {'Sức chứa'}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-black ${isFull ? 'text-red-500' : 'text-blue-600'}`}>{branch.currentOccupancy}</span>
                                <span className="text-sm font-bold text-slate-400">/ {branch.capacity}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-black ${isFull ? 'text-red-500' : 'text-blue-600'}`}>{occPct.toFixed(0)}%</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                               className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                               style={{ width: `${occPct}%` }}
                            ></div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Metrics Grid */}
                     <div className="p-7 bg-white/50 backdrop-blur-sm flex-1 grid grid-cols-2 gap-4 border-b border-slate-100/60 relative z-10">
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/50 group-hover:bg-white transition-colors">
                          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                             <Layers className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-wider">
                               {'Số tầng'}
                             </span>
                          </div>
                          <div className="text-lg font-black text-slate-800">{branch.floors?.length || 1} <span className="text-xs text-slate-400 font-bold">{'tầng'}</span></div>
                       </div>
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/50 group-hover:bg-white transition-colors">
                          <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                             <LayoutGrid className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-wider">
                               {'Block/Khu'}
                             </span>
                          </div>
                          <div className="text-lg font-black text-slate-800 line-clamp-1">{branch.block || ('Chưa chia')}</div>
                       </div>
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/50 group-hover:bg-white transition-colors">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                            {'Giao dịch lũy kế'}
                          </span>
                          <span className="text-xl font-black text-slate-800">{branch.totalSessions} <span className="text-xs text-slate-400 font-bold">{'lượt'}</span></span>
                       </div>
                       <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/50 group-hover:bg-blue-50 transition-colors">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                            {'Doanh thu'}
                          </span>
                          <span className="text-xl font-black text-emerald-600 line-clamp-1">{formatCurrency(branch.totalRevenue)}</span>
                       </div>
                     </div>
    
                     {/* Footer Status */}
                     <div className="px-7 py-5 bg-white flex flex-wrap gap-3 justify-between items-center relative z-10">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative flex items-center justify-center">
                             <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                               statusTone === 'amber' ? 'bg-amber-400' : statusTone === 'red' ? 'bg-red-400' : 'bg-emerald-400'
                             }`}></div>
                             <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                               statusTone === 'amber' ? 'bg-amber-500' : statusTone === 'red' ? 'bg-red-500' : 'bg-emerald-500'
                             }`}></div>
                          </div>
                          <span className="text-sm font-bold text-slate-700 truncate">
                            {!accepting ? 'Chỉ cho xe ra' : isFull ? 'Bãi đã đầy' : 'Đang hoạt động'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleToggleEntries(branch.id);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              accepting
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {accepting ? (
                              <><DoorClosed className="w-3.5 h-3.5" /> Đóng nhận xe</>
                            ) : (
                              <><DoorOpen className="w-3.5 h-3.5" /> Mở nhận xe</>
                            )}
                          </button>
                          <button className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white hover:bg-blue-600 hover:border-blue-600 transition-all shadow-md shadow-slate-900/10 hover:shadow-blue-600/20">
                            {'Chi tiết'}
                          </button>
                        </div>
                     </div>
                   </div>
                 );
               })}
            </div>
    
            {/* Branch & Map Management Section */}
              <div className="grid grid-cols-12 gap-8">
                {/* Create Branch Card */}
                <div className="col-span-12 lg:col-span-5 bg-gradient-to-b from-white to-slate-50/80 p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 flex flex-col justify-between relative overflow-hidden">
                  {/* Ambient Background Glows */}
                  <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
    
                  <div className="relative z-10">
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-inner flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                          {'Tạo chi nhánh mới'}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {'Thêm chi nhánh bãi đỗ xe bằng tìm kiếm địa chỉ'}
                        </p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleAddLot} className="space-y-5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                          {'Tên chi nhánh'}
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder={"Ví dụ: Landmark 81 - Bãi đỗ A1"}
                          className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                          value={newLot.name}
                          onChange={e => setNewLot({...newLot, name: e.target.value})}
                        />
                      </div>
    
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                          {'Địa chỉ / Tìm vị trí'}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              placeholder={"Nhập địa chỉ để tự động gợi ý..."}
                              className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                              value={newLotAddress}
                              onChange={e => {
                                setNewLotAddress(e.target.value);
                                setShowSuggestions(true);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
    
                            {showSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                                {addressSuggestions.map((item, index) => {
                                  const name = item.display_name.split(',')[0];
                                  const details = item.display_name.split(',').slice(1).join(',').trim();
                                  
                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => handleSelectSuggestion(item)}
                                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5 cursor-pointer text-slate-800"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 truncate">{details}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleSearchAddress}
                            disabled={isSearchingLocation}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[14px]">explore</span>
                            {'ĐỊNH VỊ'}
                          </button>
                        </div>
                        
                        {searchFeedback && (
                          <p className={`text-[10px] font-bold mt-1.5 ml-1 ${searchFeedback.includes('thành công') || searchFeedback.includes('successfully') ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {searchFeedback}
                          </p>
                        )}
                      </div>
    
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                            {'Khu vực / Block'}
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="Block A"
                            className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                            value={newLot.block}
                            onChange={e => setNewLot({...newLot, block: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                            {'Tầng mặc định'}
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="Tầng 1"
                            className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                            value={newLot.floor}
                            onChange={e => setNewLot({...newLot, floor: e.target.value})}
                          />
                        </div>
                      </div>
    
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                          {'Danh sách Tầng'} ({newLotFloors.length})
                        </label>
                        <div className="flex flex-wrap items-center gap-2 bg-slate-100/40 border border-slate-200/60 p-3 rounded-2xl min-h-[48px]">
                          {newLotFloors.map(f => (
                            <div key={f} className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1.5 rounded-full shadow-sm hover:border-slate-350 transition-all">
                              <span className="text-[10px] font-bold text-slate-700 pl-1">
                                {'Tầng'} {f}
                              </span>
                              <input 
                                type="number" 
                                min="1"
                                value={
                                  newLotFloorCapacities[f.toString()] === undefined ||
                                  newLotFloorCapacities[f.toString()] === null
                                    ? ''
                                    : newLotFloorCapacities[f.toString()]
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    setNewLotFloorCapacities((prev) => ({ ...prev, [f.toString()]: '' as any }));
                                    return;
                                  }
                                  const n = Number.parseInt(raw, 10);
                                  if (!Number.isNaN(n)) {
                                    setNewLotFloorCapacities((prev) => ({ ...prev, [f.toString()]: n }));
                                  }
                                }}
                                className="w-10 h-5 px-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-700 focus:outline-none focus:border-blue-400 text-center hide-number-spinners"
                                title={"Số ô đỗ ở tầng này"}
                              />
                              <button 
                                type="button" 
                                onClick={() => setNewLotFloors(newLotFloors.filter(x => x !== f))}
                                className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-500 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors text-[8px]"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              let next = 1;
                              while (newLotFloors.includes(next)) {
                                next++;
                              }
                              setNewLotFloors([...newLotFloors, next].sort((a, b) => a - b));
                            }}
                            className="inline-flex items-center gap-1 bg-blue-50/80 hover:bg-blue-600 border border-blue-100/60 text-blue-600 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 shadow-sm"
                          >
                            <Plus className="w-3 h-3" /> {'Thêm tầng'}
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-6 cursor-pointer relative overflow-hidden group btn-premium"
                      >
                        <Plus className="w-4 h-4" />
                        {'Thêm Chi Nhánh mới'}
                        <div className="shimmer-effect"></div>
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* List Existing Branches Card */}
                <div className="col-span-12 lg:col-span-7 bg-gradient-to-b from-white to-slate-50/80 p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 flex flex-col relative overflow-hidden">
                  {/* Ambient Background Glows */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
    
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-inner flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                            {'Danh sách chi nhánh hiện có'}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {'Thêm/xóa tầng hoặc xóa chi nhánh trực tiếp trên danh sách'}
                          </p>
                        </div>
                      </div>
    
                      <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          placeholder={"Tìm tên bãi đỗ..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[420px] pr-2 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {branches.filter(lot => lot.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((lot, idx) => (
                        <div 
                          key={lot.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200/80 bg-white hover:bg-blue-50/5 transition-all duration-300 group gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 relative z-10"
                        >
                          <div className="flex items-start gap-4.5 min-w-0">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm relative group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse z-10"></span>
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <input 
                                type="text"
                                value={lot.name}
                                onChange={(e) => handleFieldChange(lot.id, 'name', e.target.value)}
                                onBlur={() => handleFieldBlur(lot.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                className="text-[14px] font-extrabold text-slate-800 tracking-tight leading-snug hover:text-blue-600 transition-all bg-slate-50/50 border border-slate-200/60 hover:border-blue-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none w-full max-w-[280px] px-3 py-1.5 rounded-full shadow-sm"
                                title={"Sửa tên chi nhánh"}
                                placeholder={"Tên chi nhánh..."}
                              />
                              
                              {/* Floor config section */}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 shrink-0">
                                  <Layers className="w-3.5 h-3.5 text-slate-400" /> {'Tầng:'}
                                </span>
                                {(lot.floors || [1, 2, 3]).map((f: number) => (
                                  <span key={f} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full hover:border-slate-300 transition-all">
                                    <span className="text-[10px] font-bold text-slate-600">
                                      {'Tầng'} {f}
                                    </span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={
                                        lot.floorCapacities?.[f.toString()] === undefined ||
                                        lot.floorCapacities?.[f.toString()] === null
                                          ? ''
                                          : lot.floorCapacities[f.toString()]
                                      }
                                      onChange={(e) => handleFloorCapacityChange(lot.id, f, e.target.value)}
                                      onBlur={() => handleFloorCapacityBlur(lot.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                      }}
                                      className="w-10 h-5 px-1 ml-0.5 bg-white border border-slate-200/80 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 rounded-full text-[10px] font-bold text-slate-700 text-center hide-number-spinners transition-all shadow-sm"
                                      title={`Số ô ở tầng ${f}`}
                                    />
                                    <button
                                      onClick={() => handleRemoveFloorFromLot(lot.id, f)}
                                      className="w-3.5 h-3.5 rounded-full bg-slate-200/70 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-[8px] font-bold ml-0.5"
                                      title={"Xóa tầng này"}
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                                <button
                                  onClick={() => handleAddFloorToLot(lot.id)}
                                  className="inline-flex items-center gap-1 bg-blue-50/50 border border-blue-100/50 hover:bg-blue-600 hover:text-white text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all duration-200"
                                  title={"Thêm tầng"}
                                >
                                  <Plus className="w-3 h-3" /> {'Thêm tầng'}
                                </button>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-400 mt-3 border-t border-slate-100/80 pt-2.5">
                                <span className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors group/input relative">
                                  <Globe className="w-3.5 h-3.5 text-blue-500/80" /> 
                                  <input 
                                    type="text"
                                    value={lot._tempCoords !== undefined ? lot._tempCoords : `${lot.latitude || '0'}, ${lot.longitude || '0'}`}
                                    onChange={(e) => handleCoordinatesChange(lot.id, e.target.value)}
                                    onBlur={() => handleFieldBlur(lot.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    className="bg-slate-50/50 border border-slate-200/60 hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none w-32 text-left px-2.5 py-1 rounded-full transition-all shadow-sm"
                                    title={"Sửa tọa độ (Vĩ độ, Kinh độ)"}
                                  />
                                </span>
                                <span className="text-slate-200">•</span>
                                <span className="flex items-center gap-1 text-slate-500 group/input relative">
                                  <Layers className="w-3.5 h-3.5 text-indigo-500/85" /> 
                                  <input 
                                    type="text"
                                    value={lot.block || ''}
                                    onChange={(e) => handleFieldChange(lot.id, 'block', e.target.value)}
                                    onBlur={() => handleFieldBlur(lot.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    className="bg-slate-50/50 border border-slate-200/60 hover:border-slate-300 hover:bg-white focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 focus:outline-none w-20 text-left px-2.5 py-1 rounded-full transition-all shadow-sm"
                                    title={"Sửa tên Block"}
                                    placeholder="Block..."
                                  />
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteLot(lot.id)}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer sm:self-center self-end shadow-sm hover:shadow-md"
                            title={"Xóa chi nhánh"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        
            {/* Custom Floating Toast Notification */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                    toastMessage.type === 'success'
                      ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/10'
                      : toastMessage.type === 'error'
                      ? 'bg-rose-500/90 text-white border-rose-400/50 shadow-rose-500/10'
                      : 'bg-blue-500/90 text-white border-blue-400/50 shadow-blue-500/10'
                  }`}
                >
                  <span className="font-bold text-sm tracking-wide">{toastMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
    
          </AdminLayout>
  );
};

export default AdminReports;
