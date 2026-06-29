from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"
for path in ROOT.rglob("*.tsx"):
    t = path.read_text(encoding="utf-8")
    if "<BrandLogo" not in t or "import BrandLogo" in t:
        continue
    rel = (
        "../../components/brand/BrandLogo"
        if "auth" in path.parts
        else "../components/brand/BrandLogo"
    )
    imp = f"import BrandLogo from '{rel}';\n"
    i = t.find("import ")
    if i == -1:
        t = imp + t
    else:
        e = t.find("\n", i)
        t = t[: e + 1] + imp + t[e + 1 :]
    path.write_text(t, encoding="utf-8")
    print("import", path.relative_to(ROOT))
