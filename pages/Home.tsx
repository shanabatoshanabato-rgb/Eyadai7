
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
    <div className="flex-grow space-y-24 py-16 px-6 md:px-12 lg:px-20">
      {/* Hero Section - Balanced & Sleek */}
      <section className="max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Engineer & Guide
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.2]">
            {t('heroTitle')} <br />
            <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              {t('heroSubtitle')}
            </span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed opacity-90">
            {t('heroDesc')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/chat" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            {t('startChat')} <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/settings" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {t('configuration')}
          </Link>
        </div>
      </section>

      {/* Bento Grid - Professional Spacing */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Writing Studio Card */}
        <div className="md:col-span-2 p-8 bg-indigo-600 rounded-[2rem] text-white space-y-6 relative overflow-hidden group shadow-md">
          <div className="relative z-10">
            <div className="p-3 bg-white/10 rounded-xl w-fit mb-4">
              <PenTool className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black mb-2 tracking-tight">{t('writing')}</h3>
            <p className="text-indigo-100 text-base font-medium leading-relaxed max-w-lg mb-6">
              {t('writingSubTitle')}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {['tabGrammar', 'tabGenerator', 'tabIrab'].map(key => (
                <span key={key} className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold border border-white/5 uppercase tracking-wider">{t(key)}</span>
              ))}
            </div>
            <Link to="/writing" className="mt-8 inline-flex items-center gap-2 font-black text-base hover:gap-4 transition-all bg-white text-indigo-600 px-6 py-3 rounded-lg shadow-md">
              {t('startBuilding')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-700"></div>
          <Feather className="absolute bottom-6 right-6 w-24 h-24 text-white/5 rotate-12" />
        </div>

        {/* Homework Helper Card */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl w-fit">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">{t('homework')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
              Step-by-step intelligence for complex subjects and research.
            </p>
          </div>
          <Link to="/homework" className="flex items-center gap-2 font-black text-lg text-blue-600 group">
            Check it out <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Voice Call Card */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <PhoneCall className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">{t('voice')}</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
            Real-time voice conversations with zero latency.
          </p>
          <Link to="/voice" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-black text-base shadow-md shadow-green-600/20">
            Call Now
          </Link>
        </div>

        {/* Global Master Card */}
        <div className="md:col-span-2 p-8 bg-slate-900 dark:bg-blue-600 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
          <div className="space-y-4 max-w-sm">
            <Globe2 className="w-12 h-12 text-blue-400 dark:text-white" />
            <h3 className="text-3xl font-black tracking-tighter">Multi-Dialect Master</h3>
            <p className="text-slate-400 dark:text-blue-100 font-medium text-base leading-relaxed">
              Native support for Arabic Dialects, English, French, and Spanish.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full md:w-auto">
            <div className="px-5 py-3 bg-white/5 rounded-xl font-black border border-white/10 italic text-base">"Bonjour, je suis Eyad AI."</div>
            <div className="px-5 py-3 bg-white/5 rounded-xl font-black border border-white/10 italic text-base">"يا هلا يا بطل، إياد معاك."</div>
          </div>
        </div>
      </section>
    </div>
  );
};
