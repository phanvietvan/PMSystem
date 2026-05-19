from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/pages/ProfilePage.tsx"
t = p.read_text(encoding="utf-8")
old = """            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">P</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tighter text-slate-900">PM System</span>
            </div>"""
new = "            <BrandLogo size=\"md\" />"
if old in t:
    t = t.replace(old, new, 1)
    if "import BrandLogo" not in t:
        t = t.replace(
            "import Navbar from '../components/layout/Navbar';",
            "import Navbar from '../components/layout/Navbar';\nimport BrandLogo from '../components/brand/BrandLogo';",
        )
    p.write_text(t, encoding="utf-8")
    print("ProfilePage updated")
else:
    print("block not found")
