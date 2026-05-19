from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/pages/AdminUsers.tsx"
t = p.read_text(encoding="utf-8")
D = "div"

old_sidebar = f"""        <{D} className="px-8 mb-10 group cursor-pointer">
          <Link to="/" className="flex items-center gap-3">
            <{D} className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform group-hover:rotate-6">
              <span className="text-white font-black text-2xl">P</span>
            </{D}>
            <{D}>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tighter">ParkIntel</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Command Center</p>
            </{D}>
          </Link>
        </{D}>"""

new_sidebar = f"""        <{D} className="px-8 mb-10">
          <BrandLogo asLink size="sm" showTagline tagline="Command Center" />
        </{D}>"""

t = t.replace(old_sidebar, new_sidebar)
t = t.replace("Admin ParkIntel", "PM System")
t = t.replace(
    '<input className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full p-0 placeholder:text-slate-400" placeholder="Tìm kiếm nhân sự..." type="text"/>',
    '<input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full p-0 placeholder:text-slate-400" placeholder="Tìm kiếm nhân sự..." type="text"/>',
)

t = t.replace(
    """             {[
                { label: 'Tổng nhân sự', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Hoạt động', value: '18', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Yêu cầu mới', value: '03', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Quản trị viên', value: '05', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
             ].map((stat, i) => (""",
    """             {[
                { label: 'Tổng nhân sự', value: String(stats.total), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Hoạt động', value: String(stats.active), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Yêu cầu mới', value: String(stats.pending).padStart(2, '0'), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Quản trị viên', value: String(stats.admins).padStart(2, '0'), icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
             ].map((stat, i) => (""",
)

t = t.replace(
    """           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý Người dùng</h2>
              <p className="text-sm text-slate-500 font-medium">Phân quyền và quản lý tài khoản nhân viên toàn hệ thống.</p>
           </div>""",
    """           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý Người dùng</h2>
              <p className="text-sm text-slate-500 font-medium">Phân quyền và quản lý tài khoản nhân viên toàn hệ thống.</p>
              {error && !editing && (
                <p className="mt-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 w-fit">{error}</p>
              )}
              {!canEdit && (
                <p className="mt-3 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 w-fit">
                  Tài khoản của bạn chỉ được xem danh sách. Cần vai trò Admin hoặc Staff để chỉnh sửa.
                </p>
              )}
           </div>""",
)

t = t.replace("users.map((user)", "filtered.map((user)")
t = t.replace(
    """                               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                  <Shield className={`w-3.5 h-3.5 ${(user.role || '').includes('Admin') ? 'text-blue-600' : 'text-slate-400'}`} />
                                  <span className="text-[11px] font-bold text-slate-900">{user.role || 'User'}</span>
                               </div>""",
    """                               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                  <Shield className={`w-3.5 h-3.5 ${
                                    user.role === 'Admin' ? 'text-purple-600' :
                                    user.role === 'Staff' ? 'text-blue-600' : 'text-slate-400'
                                  }`} />
                                  <span className="text-[11px] font-bold text-slate-900">{user.role || 'User'}</span>
                               </div>""",
)

t = t.replace(
    """                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  (user.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  user.status === 'Suspended' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-slate-50 text-slate-400 border-slate-200'
                               }`}>
                                  {user.status || 'Active'}
                               </span>""",
    """                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  statusClass[user.status] || statusClass.Active
                               }`}>
                                  {statusLabel[user.status] || user.status || 'ACTIVE'}
                               </span>""",
)

t = t.replace(
    """                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                               {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </td>""",
    """                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                               {user.lastLoginAt
                                 ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                                 : user.createdAt
                                   ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                   : 'N/A'}
                            </td>""",
)

t = t.replace(
    """                               <motionless className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600">
                                     <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </motionless>""".replace("motionless", D),
    f"""                               <{D} className="flex items-center justify-end gap-2">
                                  {{canEdit && (
                                    <button
                                      type="button"
                                      onClick={{() => openEdit(user)}}
                                      className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}}
                               </{D}>""",
)

t = t.replace(
    """                <span className="text-xs font-bold text-slate-400">Hiển thị {users.length} của 24 nhân sự</span>""",
    """                <span className="text-xs font-bold text-slate-400">Hiển thị {filtered.length} / {users.length} nhân sự</span>""",
)

modal = f"""
      {{editing && (
        <motionless className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motionless className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <motionless className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Chỉnh sửa nhân sự</h3>
              <button type="button" onClick={{closeEdit}} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </motionless>
            <form onSubmit={{handleSave}} className="p-8 space-y-4">
              {{error && <p className="text-sm font-bold text-red-600">{{error}}</p>}}
              <motionless className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Họ</span>
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.firstName}} onChange={{(e) => setForm({{...form, firstName: e.target.value}})}} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Tên</span>
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.lastName}} onChange={{(e) => setForm({{...form, lastName: e.target.value}})}} />
                </label>
              </motionless>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase">SĐT</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.phoneNumber}} onChange={{(e) => setForm({{...form, phoneNumber: e.target.value}})}} />
              </label>
              <motionless className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Biển số</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.licensePlate}} onChange={{(e) => setForm({{...form, licensePlate: e.target.value}})}} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Loại xe</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.vehicleType}} onChange={{(e) => setForm({{...form, vehicleType: e.target.value}})}} />
                </label>
              </motionless>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase">Địa chỉ</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={{form.address}} onChange={{(e) => setForm({{...form, address: e.target.value}})}} />
              </label>
              <motionless className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Vai trò</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={{form.role}} onChange={{(e) => setForm({{...form, role: e.target.value}})}}>
                    <option value="User">User</option>
                    <option value="Staff">Staff</option>
                    {{canAssignAdmin && <option value="Admin">Admin</option>}}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Trạng thái</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={{form.status}} onChange={{(e) => setForm({{...form, status: e.target.value}})}}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Banned">Banned</option>
                    <option value="PendingVerification">Pending</option>
                  </select>
                </label>
              </motionless>
              <motionless className="flex gap-3 pt-4">
                <button type="button" onClick={{closeEdit}} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Hủy</button>
                <button type="submit" disabled={{saving}} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                  {{saving ? 'Đang lưu...' : 'Lưu thay đổi'}}
                </button>
              </motionless>
            </form>
          </motionless>
        </motionless>
      )}}
"""

modal = modal.replace("motionless", D)
if "{editing &&" not in t:
    t = t.replace("    </div>\n  );\n};\n\nexport default AdminUsers;", modal + "\n    </motionless>\n  );\n};\n\nexport default AdminUsers;".replace("motionless", D))

p.write_text(t, encoding="utf-8")
print("patched ok")
