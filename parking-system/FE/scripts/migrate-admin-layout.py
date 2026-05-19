import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "src" / "pages"
PAGES = [
    "AdminDashboard.tsx",
    "AdminMonitoring.tsx",
    "AdminReservations.tsx",
    "AdminReports.tsx",
    "AdminUsers.tsx",
    "AdminSettings.tsx",
]

SHELL_START = re.compile(
    r"return \(\s*<div className=\"bg-\[#f8f9fb\].*?</header>\s*",
    re.S,
)
CLOSING = re.compile(r"\s*</main>\s*</div>\s*\);\s*};", re.S)
NAV_LINKS = re.compile(r"\n  const navLinks = \[.*?\];\n", re.S)


def layout_props(path: Path) -> str:
    if path.name == "AdminUsers.tsx":
        return (
            '\n      searchPlaceholder="Tìm kiếm nhân sự..."'
            "\n      searchValue={search}"
            "\n      onSearchChange={setSearch}"
            '\n      headerActions={'
            "\n        <button className=\"flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mr-4\">"
            "\n          <UserPlus className=\"w-4 h-4\" />"
            "\n          Thêm Thành viên"
            "\n        </button>"
            "\n      }"
        )
    return ""


def migrate(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if "<AdminLayout" in text and "min-h-screen flex font-" not in text:
        print(path.name, "skip (done)")
        return

    if "import AdminLayout" not in text:
        if "import { motion }" in text:
            text = text.replace(
                "import { motion } from 'framer-motion';",
                "import { motion } from 'framer-motion';\nimport AdminLayout from '../components/admin/AdminLayout';",
            )
        else:
            text = (
                "import AdminLayout from '../components/admin/AdminLayout';\n" + text
            )

    text = NAV_LINKS.sub("\n", text)

    open_tag = f"return (\n    <AdminLayout{layout_props(path)}>\n      "
    text, n = SHELL_START.subn(open_tag, text, count=1)
    if n != 1:
        raise RuntimeError(f"{path.name}: shell start not matched")

    text, n2 = CLOSING.subn("\n    </AdminLayout>\n  );\n};", text, count=1)
    if n2 != 1:
        raise RuntimeError(f"{path.name}: closing not matched")

    path.write_text(text, encoding="utf-8")
    print(path.name, "migrated")


for name in PAGES:
    migrate(BASE / name)
