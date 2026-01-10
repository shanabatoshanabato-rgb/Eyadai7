
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  PhoneCall, 
  BookOpen, 
  PenTool, 
  Globe2,
  Feather
} from 'lucide-react';
import { useTranslation } from '../translations';

export const Home: React.FC = () => {
  const t = useTranslation();
  
  return (
    <div className="flex-grow space-y-32 py-20 px-6 md:px-12 lg:px-24">
      {/* Hero Section - Balanced & Clean */}
      <section className="max-w-6xl mx-auto text-center space-y-10">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Sparkles className="w-4 h-4" /> Next-Gen AI Engineer & Guide
        </div>
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]">
            {t('heroTitle')} <br />
            <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              {t('heroSubtitle')}
            </span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed opacity-90">
            {t('heroDesc')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-6">
          <Link to="/chat" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-600/25 flex items-center gap-3">
            {t('startChat')} <ArrowRight className="w-6 h-6" />
          </Link>
          <Link to="/settings" className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {t('configuration')}
          </Link>
        </div>
      </section>

      {/* Bento Grid - Professional Spacing */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Writing Studio Card */}
        <div className="md:col-span-2 p-10 bg-indigo-600 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden group shadow-lg">
          <div className="relative z-10">
            <div className="p-4 bg-white/10 rounded-2xl w-fit mb-6">
              <PenTool className="w-12 h-12" />
            </div>
            <h3 className="text-4xl font-black mb-4 tracking-tight">{t('writing')}</h3>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed max-w-xl mb-8">
              {t('writingSubTitle')}
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              {['tabGrammar', 'tabGenerator', 'tabIrab'].map(key => (
                <span key={key} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold border border-white/5 uppercase tracking-wider">{t(key)}</span>
              ))}
            </div>
            <Link to="/writing" className="mt-10 inline-flex items-center gap-3 font-black text-lg hover:gap-6 transition-all bg-white text-indigo-600 px-8 py-4 rounded-xl shadow-xl">
              {t('startBuilding')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-700"></div>
          <Feather className="absolute bottom-8 right-8 w-32 h-32 text-white/5 rotate-12" />
        </div>

        {/* Homework Helper Card */}
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl w-fit">
              <BookOpen className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">{t('homework')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
              Step-by-step intelligence for complex scientific subjects and research.
            </p>
          </div>
          <Link to="/homework" className="flex items-center gap-3 font-black text-xl text-blue-600 group">
            Check it out <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {/* Voice Call Card */}
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-6 mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl">
              <PhoneCall className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">{t('voice')}</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
            Real-time voice conversations with zero latency and perfect matching.
          </p>
          <Link to="/voice" className="inline-block px-8 py-4 bg-green-600 text-white rounded-xl font-black text-lg shadow-lg shadow-green-600/20">
            Call Now
          </Link>
        </div>

        {/* Global Master Card */}
        <div className="md:col-span-2 p-10 bg-slate-900 dark:bg-blue-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-lg">
          <div className="space-y-6 max-w-md">
            <Globe2 className="w-16 h-16 text-blue-400 dark:text-white" />
            <h3 className="text-4xl font-black tracking-tighter">Multi-Dialect Master</h3>
            <p className="text-slate-400 dark:text-blue-100 font-medium text-lg leading-relaxed">
              Native support for Arabic Dialects, English, French, and Spanish. Matches your vibe instantly.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 w-full md:w-auto">
            <div className="px-6 py-4 bg-white/5 rounded-2xl font-black border border-white/10 italic text-lg">"Bonjour, je suis Eyad AI."</div>
            <div className="px-6 py-4 bg-white/5 rounded-2xl font-black border border-white/10 italic text-lg">"يا هلا يا بطل، إياد معاك."</div>
          </div>
        </div>
      </section>
    </div>
  );
};
