import sys
import re

path = r'c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change state
content = content.replace('const [isHistoryOpen, setIsHistoryOpen] = useState(false);',
                          'const [activeTab, setActiveTab] = useState<"home" | "history">("home");')

# 2. Update navbar
content = re.sub(r'<button onClick={\(\) => setIsHistoryOpen\(true\)} className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600 cursor-pointer">\n              Lịch sử\n            </button>',
                 '<button onClick={() => setActiveTab("history")} className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${activeTab === "history" ? "text-blue-600" : "text-slate-500 hover:text-blue-600"} cursor-pointer`}>\n              Lịch sử\n              {activeTab === "history" && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}\n            </button>',
                 content)

# We also need to change the "Trang chủ" to use the activeTab state!
# But since I didn't save the old one perfectly, let's just do it with replace.
# The previous script might not have run on the file successfully.
content = content.replace('<a href="#" className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-blue-600">\n              Trang chủ\n              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />\n            </a>',
                          '<button onClick={() => setActiveTab("home")} className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${activeTab === "home" ? "text-blue-600" : "text-slate-500 hover:text-blue-600"} cursor-pointer`}>\n              Trang chủ\n              {activeTab === "home" && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}\n            </button>')


# 3. Extract the Modal block
start_marker = '{/* History Modal (Moved from right column) */}'
end_marker = '</AnimatePresence>'
start_idx = content.find(start_marker)
if start_idx != -1:
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    modal_block = content[start_idx:end_idx]

    # Remove modal block from its original position
    content = content[:start_idx] + content[end_idx:]

    # Extract just the inner History panel out of the modal
    inner_start = '{/* MongoDB Real-time audit log feed */}'
    i_start = modal_block.find(inner_start)
    i_end = modal_block.find('KẾT NỐI OK</span>\n              </div>\n            </div>') + len('KẾT NỐI OK</span>\n              </div>\n            </div>')
    history_panel = modal_block[i_start:i_end]

    # Modify the history panel slightly to fit the page and remove the close button
    history_panel = history_panel.replace('<div className="flex gap-3 items-center"><span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">LIVE MONGO</span><button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-red-500 material-symbols-outlined text-sm cursor-pointer">close</button></div>',
                                          '<div className="flex gap-3 items-center"><span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">LIVE MONGO</span></div>')

    # Create the new History page wrapper
    history_page = '\n        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 overflow-hidden flex flex-col animate-fade-in">\n' + history_panel + '\n        </main>\n'

    # 4. Wrap main with activeTab === 'home'
    content = content.replace('{/* Main 2-Column Spacious Layout */}\n      <main',
                              '{/* Main 2-Column Spacious Layout */}\n      {activeTab === "home" ? (\n      <main')

    content = content.replace('        </div>\n      </main>',
                              '        </div>\n      </main>\n      ) : (' + history_page + '      )}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
