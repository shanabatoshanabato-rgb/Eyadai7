
import React, { useState, useEffect } from 'react';
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
  Library,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { useTranslation } from '../translations';
import { Language, Theme } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('eyad-ai-theme') as Theme) || Theme.DARK);
  const location = useLocation();
  const t = useTranslation();
  const currentLang = (localStorage.getItem('eyad-ai-lang') as Language) || Language.AR;
  const isRTL = currentLang === Language.AR || currentLang === Language.DIALECT;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === Theme.DARK);
    localStorage.setItem('eyad-ai-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('chat'), path: '/chat', icon: MessageCircle },
    { name: t('searchHub'), path: '/search', icon: Search },
    { name: t('homework'), path: '/homework', icon: BookOpen },
    { name: t('writing'), path: '/writing', icon: Library },
    { name: t('voice'), path: '/voice', icon: Mic },
    { name: t('settings'), path: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#020617] text-slate-900 dark:text-white selection:bg-blue-500/30 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">EYAD AI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="ml-4 p-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90"
                title="تبديل الوضع"
              >
                {theme === Theme.DARK ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <button 
                onClick={toggleTheme}
                className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-full"
              >
                {theme === Theme.DARK ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-white/5 p-4 space-y-2 animate-in slide-in-from-top-4 shadow-2xl">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};
