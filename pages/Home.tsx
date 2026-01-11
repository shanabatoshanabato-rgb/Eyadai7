
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Settings, 
  Sparkles, 
  BookOpen, 
  Mic, 
  Search, 
  Star
} from 'lucide-react';
import { useTranslation } from '../translations';

export const Home: React.FC = () => {
  const t = useTranslation();
  
  const features = [
    {
      icon: MessageCircle,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      icon: Search,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      icon: BookOpen,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      icon: Mic,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center px-6 py-20 bg-white dark:bg-[#020617] overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-12 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 text-xs font-black uppercase tracking-widest mx-auto">
            <Star className="w-3 h-3 fill-blue-600" /> EYAD AI 2.0
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
            {t('heroTitle')} <br />
            <span className="text-blue-600 drop-shadow-[0_0_30px_rgba(37,99,235,0.2)]">{t('heroSubtitle')}</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            {t('heroDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link 
            to="/chat" 
            className="group px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-600/30"
          >
            {t('startChat')}
            <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </Link>
          
          <Link 
            to="/settings" 
            className="px-12 py-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] font-black text-xl flex items-center gap-3 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm"
          >
            {t('configuration')}
            <Settings className="w-6 h-6" />
          </Link>
        </div>

        <div className="pt-24 space-y-10">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-200 dark:bg-white/10"></div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{t('platformFeatures')}</h2>
            <div className="h-px w-12 bg-slate-200 dark:bg-white/10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
            {features.map((f, i) => (
              <div 
                key={i} 
                className={`group p-8 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-[2.5rem] hover:bg-white dark:hover:bg-white/[0.04] hover:border-blue-500/30 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-600/5`}
              >
                <div className={`w-14 h-14 ${f.bg} ${f.border} border rounded-2xl flex items-center justify-center mb-8 mx-auto md:mr-0 md:ml-auto group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500`}>
                  <f.icon className={`w-7 h-7 ${f.color} group-hover:text-white`} />
                </div>
                <h3 className="text-slate-900 dark:text-white font-black text-xl mb-3 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
