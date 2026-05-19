import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"
D = "div"

AUTH_LOGO = re.compile(
    rf"\s*/\* Brand Logo \*/\s*"
    rf'<{D} className="flex items-center space-x-3 group">'
    rf".*?"
    rf"</{D}>\s*</{D}>\s*</{D}>\s*</{D}>\s*"
    rf'<{D} className="max-w-2xl',
    re.DOTALL,
)

MOBILE_FOOTER = re.compile(
    rf"\s*/\* Mobile Brand Footer \*/\s*"
    rf'<{D} className="lg:hidden mt-12 flex items-center space-x-3 opacity-60">'
    rf".*?"
    rf"</{D}>\s*</section>",
    re.DOTALL,
)

ADMIN_SIDEBAR = re.compile(
    rf'<{D} className="px-8 mb-10 group cursor-pointer">\s*'
    rf'<Link to="/" className="flex items-center gap-3">'
    rf".*?"
    rf"</Link>\s*</{D}>",
    re.DOTALL,
)

LANDING_FOOTER = re.compile(
    rf'<{D} className="flex items-center gap-4">\s*'
    rf'<{D} className="w-10 h-10.*?'
    rf'PM System</span>\s*</{D}>',
    re.DOTALL,
)


def ensure_import(content: str, rel: str) -> str:
    imp = f"import BrandLogo from '{rel}';\n"
    if "BrandLogo" in content:
        return content
    idx = content.find("import ")
    if idx == -1:
        return imp + content
    end = content.find("\n", idx)
    return content[: end + 1] + imp + content[end + 1 :]


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    group_marker = f'<{D} className="flex items-center space-x-3 group">'
    hero_marker = f'<{D} className="max-w-2xl'
    if "logo-gradient" in text and group_marker in text and hero_marker in text:
        start = text.find(group_marker)
        end = text.find(hero_marker, start)
        if start != -1 and end != -1:
            text = (
                text[:start]
                + '<BrandLogo size="lg" asLink />'
                + "\n\n        "
                + text[end:]
            )
        if "<BrandLogo" in text and "import BrandLogo" not in text:
            rel = (
                "../../components/brand/BrandLogo"
                if "auth" in path.parts
                else "../components/brand/BrandLogo"
            )
            text = ensure_import(text, rel)

    if "/* Mobile Brand Footer */" in text:
        text = MOBILE_FOOTER.sub(
            '\n        <BrandLogo size="xs" className="lg:hidden mt-12 opacity-60" />\n      </section>',
            text,
            count=1,
        )

    if "Command Center" in text and "<BrandLogo" in text and "import BrandLogo" not in text:
        text = ensure_import(text, "../components/brand/BrandLogo")

    if path.name == "LandingPage.tsx" and "<BrandLogo" in text and "import BrandLogo" not in text:
        text = ensure_import(text, "../components/brand/BrandLogo")

    if "Command Center" in text and 'bg-blue-600 rounded-xl' in text:
        text = ADMIN_SIDEBAR.sub(
            f'<{D} className="px-8 mb-10">\n          <BrandLogo asLink size="sm" showTagline tagline="Command Center" />\n        </{D}>',
            text,
            count=1,
        )
        if "BrandLogo" in text and "import BrandLogo" not in text:
            text = ensure_import(text, "../components/brand/BrandLogo")

    if path.name == "LandingPage.tsx":
        text = LANDING_FOOTER.sub('<BrandLogo size="md" asLink />', text, count=1)
        if "import BrandLogo" not in text:
            text = ensure_import(text, "../components/brand/BrandLogo")

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


changed = []
for path in ROOT.rglob("*.tsx"):
    if patch_file(path):
        changed.append(str(path.relative_to(ROOT.parent)))

print("Updated:", *changed, sep="\n  " if changed else " (none)")
