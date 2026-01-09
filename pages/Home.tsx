
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  PhoneCall, 
  BookOpen, 
  FileText, 
  Globe2 
} from 'lucide-react';
import { useTranslation } from '../translations';

export const Home: React.FC = () => {
  const t = useTranslation();
  
  return (
    <div className="flex-grow space-y-24 py-16 px-4">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Assistant
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
          {t('heroTitle')} <br />
          <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">{t('heroSubtitle')}</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          {t('heroDesc')}
        </p>
        <div className="flex flex-wrap justify-center gap-6 pt-4">
          <Link to="/chat" className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3">
            {t('startChat')} <ArrowRight className="w-6 h-6" />
          </Link>
          <Link to="/settings" className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {t('configuration')}
          </Link>
        </div>
      </section>

      {/* Unified Features Bento Grid */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-8 bg-blue-600 rounded-[40px] text-white space-y-6 relative overflow-hidden group">
          <div className="relative z-10">
            <PhoneCall className="w-16 h-16 mb-6 opacity-80" />
            <h3 className="text-4xl font-black">{t('voice')}</h3>
            <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-md">
              Speak naturally to Eyad AI. Our Live API enables real-time spoken interactions that feel human.
            </p>
            <Link to="/voice" className="mt-8 inline-flex items-center gap-2 font-bold hover:gap-4 transition-all">
              Try Voice Call <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] space-y-6">
          <BookOpen className="w-12 h-12 text-indigo-500" />
          <h3 className="text-2xl font-black">{t('homework')}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            From math to history, Eyad provides step-by-step solutions instantly inside the chat window.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] space-y-6">
          <FileText className="w-12 h-12 text-green-500" />
          <h3 className="text-2xl font-black">{t('docs')}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Generate essays, reports, and code blocks with formatting and instant download.
          </p>
        </div>

        <div className="md:col-span-2 p-8 bg-slate-900 dark:bg-slate-800 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-12">
          <div className="space-y-4">
            <Globe2 className="w-12 h-12 text-blue-400" />
            <h3 className="text-3xl font-black">Global Language Master</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Native support for Arabic, English, French, and Spanish.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/5 rounded-2xl font-bold border border-white/10 italic">"Bonjour, comment puis-je vous aider ?"</div>
          </div>
        </div>
      </section>
    </div>
  );
};
