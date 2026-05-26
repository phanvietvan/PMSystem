import re

with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-system\FE\src\components\admin\AdminLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add state
if "const [isNotifOpen, setIsNotifOpen] = React.useState(false);" not in content:
    content = content.replace("const AdminLayout = ({", "const AdminLayout = ({\n  const [isNotifOpen, setIsNotifOpen] = React.useState(false);")
    # Actually wait, let's just insert it before `const location = useLocation();`
    content = content.replace("const location = useLocation();", "const [isNotifOpen, setIsNotifOpen] = React.useState(false);\n  const location = useLocation();")

# Add import
if "import NotificationPanel" not in content:
    content = content.replace("import BrandLogo", "import NotificationPanel from '../common/NotificationPanel';\nimport BrandLogo")

# Modify bell button
bell_regex = re.compile(r'(<button className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-\[0_2px_8px_rgba\(0,0,0,0\.04\)\] hover:shadow-\[0_4px_15px_rgba\(37,99,235,0\.12\)\] hover:-translate-y-0\.5 relative group active:scale-95".*?</button>)', re.DOTALL)
bell_replacement = """<div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 relative group active:scale-95"
              >
                <Bell size={18} className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-125"></span>
              </button>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-12 z-50">
                    <NotificationPanel role="admin" onClose={() => setIsNotifOpen(false)} />
                  </div>
                </>
              )}
            </div>"""

content = bell_regex.sub(bell_replacement, content)

with open(r"c:\Users\Admin\Desktop\Parking Building Management System\parking-system\FE\src\components\admin\AdminLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Admin Navbar!")
