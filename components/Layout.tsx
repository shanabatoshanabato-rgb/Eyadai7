
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  Sparkles,
  Mic,
  PenTool,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  const currentLang = (localStorage.getItem('eyad-ai-lang') as Language) || Language.AR;
  const isRTL = currentLang === Language.AR || currentLang === Language.DIALECT;

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('chat'), path: '/chat', icon: MessageCircle },
    { name: t('homework'), path: '/homework', icon: BookOpen },
    { name: t('writing'), path: '/writing', icon: PenTool },
    { name: t('voice'), path: '/voice', icon: Mic },
    { name: t('settings'), path: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 z-50 flex flex-col w-72 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}>
        <div className="flex items-center gap-3 px-8 h-20 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">EYAD AI</span>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600" />
            <div className="flex flex-col">
              <span className="text-xs font-black dark:text-white uppercase tracking-widest">Premium User</span>
              <span className="text-[10px] text-slate-400">Version 2.0 Stable</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex lg:hidden items-center justify-between px-6 h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="text-xl font-black text-blue-600 tracking-tighter uppercase">EYAD AI</Link>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        <main className="flex-grow overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};
