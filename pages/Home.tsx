
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Mic, BookOpen, PenTool, Globe, Shield, Zap } from 'lucide-react';
import { useTranslation } from '../translations';

export const Home: React.FC = () => {
  const t = useTranslation();
  
  return (
    <div className="min-h-full py-12 px-6 md:px-12 lg:px-20 space-y-20">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-start">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-top-4 duration-700">
            <Zap className="w-3.5 h-3.5 fill-blue-600" /> Powered by Gemini 3.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
            {t('heroTitle')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              {t('heroSubtitle')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {t('heroDesc')}
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <Link to="/chat" className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3">
              {t('startChat')} <ArrowRight className="w-6 h-6" />
            </Link>
            <Link to="/voice" className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
              <Mic className="w-6 h-6 text-blue-600" /> {t('voice')}
            </Link>
          </div>
        </div>

        <div className="flex-1 relative hidden lg:block">
          <div className="w-full aspect-square bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[3rem] rotate-3 opacity-10 absolute inset-0 blur-3xl" />
          <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 transform hover:-rotate-1 transition-transform duration-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Eyad Assistant</span>
                <span className="text-xs text-green-500 font-bold">● Active & Secure</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="pt-4 grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30" />
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { icon: BookOpen, title: t('homework'), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', path: '/homework' },
          { icon: PenTool, title: t('writing'), color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', path: '/writing' },
          { icon: Globe, title: t('chat'), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', path: '/chat' },
        ].map((feat, i) => (
          <Link key={i} to={feat.path} className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2">
            <div className={`p-4 ${feat.bg} rounded-2xl w-fit mb-6 transition-transform group-hover:rotate-12`}>
              <feat.icon className={`w-8 h-8 ${feat.color}`} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">{feat.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
              تحسين جودة المخرجات باستخدام أحدث نماذج الاستدلال والبحث الذكي.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
              Explore Now <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};
