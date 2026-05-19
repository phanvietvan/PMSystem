import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "src" / "pages"


def migrate_settings():
    p = BASE / "AdminSettings.tsx"
    text = p.read_text(encoding="utf-8")
    text = re.sub(r"\n  const navLinks = \[.*?\];\n", "\n", text, flags=re.S)
    if "import AdminLayout" not in text:
        text = text.replace(
            "import { motion } from 'framer-motion';",
            "import { motion } from 'framer-motion';\nimport AdminLayout from '../components/admin/AdminLayout';",
        )
    text, _ = re.subn(
        r"return \(\s*<div className=\"bg-\[#f8f9fb\].*?</header>\s*",
        "return (\n    <AdminLayout>\n      ",
        text,
        count=1,
        flags=re.S,
    )
    text, _ = re.subn(
        r"\s*</main>\s*</div>\s*\);\s*};",
        "\n    </AdminLayout>\n  );\n};",
        text,
        count=1,
        flags=re.S,
    )
    p.write_text(text, encoding="utf-8")
    print("AdminSettings ok")


def migrate_users():
    p = BASE / "AdminUsers.tsx"
    text = p.read_text(encoding="utf-8")
    text = re.sub(r"\n  const navLinks = \[.*?\];\n", "\n", text, flags=re.S)
    if "import AdminLayout" not in text:
        text = (
            "import AdminLayout from '../components/admin/AdminLayout';\n" + text
        )
    props = (
        '\n      searchPlaceholder="Tìm kiếm nhân sự..."'
        "\n      searchValue={search}"
        "\n      onSearchChange={setSearch}"
        "\n      headerActions={"
        '\n        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mr-4">'
        '\n          <UserPlus className="w-4 h-4" />'
        "\n          Thêm Thành viên"
        "\n        </button>"
        "\n      }"
    )
    text, _ = re.subn(
        r"return \(\s*<div className=\"bg-\[#f8f9fb\].*?</header>\s*",
        f"return (\n    <AdminLayout{props}>\n      ",
        text,
        count=1,
        flags=re.S,
    )
    text = text.replace("      </main>\n\n      {editing", "\n      {editing")
    text = re.sub(
        r"\n    </div>\n  \);\n};$",
        "\n    </AdminLayout>\n  );\n};",
        text,
        count=1,
    )
    p.write_text(text, encoding="utf-8")
    print("AdminUsers ok")


migrate_settings()
migrate_users()
