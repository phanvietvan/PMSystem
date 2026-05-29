import sys
import re

path = r'c:\Users\Admin\Desktop\Parking Building Management System\parking-staff\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update state initialization
old_state = 'const [activeTab, setActiveTab] = useState<"home" | "history">("home");'
new_state = '''const [activeTab, setActiveTab] = useState<"home" | "history">(() => {
    return window.location.pathname === '/history' ? 'history' : 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(window.location.pathname === '/history' ? 'history' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: "home" | "history") => {
    setActiveTab(tab);
    window.history.pushState({}, '', tab === 'history' ? '/history' : '/');
  };'''
content = content.replace(old_state, new_state)

# 2. Update navbar onClick events
content = content.replace('onClick={() => setActiveTab("home")}', 'onClick={() => navigateTo("home")}')
content = content.replace('onClick={() => setActiveTab("history")}', 'onClick={() => navigateTo("history")}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
