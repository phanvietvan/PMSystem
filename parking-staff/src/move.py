import sys
path = r'c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
content = content.replace('const [alertMessage, setAlertMessage] = useState<string | null>(null);',
                          'const [alertMessage, setAlertMessage] = useState<string | null>(null);\n  const [isHistoryOpen, setIsHistoryOpen] = useState(false);')

# 2. Update navbar
content = content.replace('<a href=\"#\" className=\"text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600\">\n              Lịch sử\n            </a>',
                          '<button onClick={() => setIsHistoryOpen(true)} className=\"text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600 cursor-pointer\">\n              Lịch sử\n            </button>')

# 3. Extract Lịch sử block
start_marker = '{/* MongoDB Real-time audit log feed */}'
end_marker = '            </div>\n\n          </div>\n\n        </div>\n      </main>'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len('            </div>\n')

log_block = content[start_idx:end_idx]

# Remove it from the original place
content = content[:start_idx] + content[end_idx:]

# Wrap it in Modal
modal_wrapper = f'''
      {{/* History Modal (Moved from right column) */}}
      <AnimatePresence>
        {{isHistoryOpen && (
          <div className=\"fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm\" onClick={{() => setIsHistoryOpen(false)}}>
            <motion.div 
              initial={{{{ scale: 0.95, opacity: 0 }}}}
              animate={{{{ scale: 1, opacity: 1 }}}}
              exit={{{{ scale: 0.95, opacity: 0 }}}}
              className=\"bg-white/95 rounded-[1.5rem] shadow-2xl max-w-2xl w-full relative flex flex-col max-h-[85vh] overflow-hidden\"
              onClick={{(e) => e.stopPropagation()}}
            >
{log_block.replace('flex-1 flex flex-col min-h-0 relative overflow-hidden z-10', 'flex flex-col min-h-0 relative overflow-hidden h-full')}
            </motion.div>
          </div>
        )}}
      </AnimatePresence>
'''

# Add close button to the Lịch sử header inside the modal wrapper
modal_wrapper = modal_wrapper.replace('<span className=\"text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md\">LIVE MONGO</span>',
                                      '<div className=\"flex gap-3 items-center\"><span className=\"text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md\">LIVE MONGO</span><button onClick={() => setIsHistoryOpen(false)} className=\"text-slate-400 hover:text-red-500 material-symbols-outlined text-sm cursor-pointer\">close</button></div>')

# Insert before Visitor Modal
insert_marker = '{/* Dynamic Visitor Ticket Modal (F4) */}'
content = content.replace(insert_marker, modal_wrapper + '\n      ' + insert_marker)

# Make Left Column wider (10) and Right Column narrower (2) since it only has buttons
content = content.replace('col-span-12 lg:col-span-8 flex flex-col', 'col-span-12 lg:col-span-9 flex flex-col')
content = content.replace('col-span-12 lg:col-span-4 flex flex-col', 'col-span-12 lg:col-span-3 flex flex-col')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
