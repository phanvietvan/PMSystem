from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src/pages/auth"
old = """        {/* Mobile Brand Footer */}
        <motionless className="lg:hidden mt-12 flex items-center space-x-3 opacity-60">
          <motionless className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-display font-extrabold text-[12px]">P</span>
          </motionless>
          <h1 className="text-sm font-display font-bold tracking-tight text-on-surface">PM System</h1>
        </motionless>"""
old = old.replace("motionless", "div")
new = '        <BrandLogo size="xs" className="lg:hidden mt-12 opacity-60" />'
for path in ROOT.glob("*.tsx"):
    t = path.read_text(encoding="utf-8")
    if old in t:
        t = t.replace(old, new, 1)
        path.write_text(t, encoding="utf-8")
        print("mobile", path.name)
