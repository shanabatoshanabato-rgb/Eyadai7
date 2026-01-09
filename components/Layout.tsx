
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  Sparkles,
  PhoneCall,
  Book,
  BookOpen
} from 'lucide-react';
import { useTranslation } from '../translations';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('chat'), path: '/chat', icon: MessageSquare },
    { name: t('homework'), path: '/homework', icon: BookOpen },
    { name: t('docs'), path: '/docs', icon: Book },
    { name: t('voice'), path: '/voice', icon: PhoneCall },
    { name: t('settings'), path: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                <Sparkles className="w-8 h-8 fill-blue-600/20" />
                <span>EYAD AI</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-1 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};
