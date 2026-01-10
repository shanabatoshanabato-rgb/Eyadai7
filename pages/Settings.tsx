
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Volume2, Globe, Save, Check, Activity, ShieldCheck } from 'lucide-react';
import { Language, Theme } from '../types';
import { VOICE_IDS, DEFAULT_SETTINGS } from '../constants';
import { useTranslation } from '../translations';
import { generateText } from '../services/geminiService';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('eyad-ai-theme') as Theme) || DEFAULT_SETTINGS.theme
  );
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('eyad-ai-lang') as Language) || DEFAULT_SETTINGS.language
  );
  const [voice, setVoice] = useState(
    localStorage.getItem('eyad-ai-voice') || DEFAULT_SETTINGS.voiceName
  );
  const [saved, setSaved] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{ status: 'idle' | 'checking' | 'ok' | 'fail', message: string }>({ status: 'idle', message: '' });
  const t = useTranslation();

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const runDiagnostic = async () => {
    setDiagnostic({ status: 'checking', message: 'Testing connection...' });
    try {
      const response = await generateText("Test connection");
      if (response && response.text) {
        setDiagnostic({ status: 'ok', message: 'API is working!' });
      } else {
        setDiagnostic({ status: 'fail', message: 'Empty response.' });
      }
    } catch (e: any) {
      setDiagnostic({ status: 'fail', message: `Failed: ${e.message}` });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('eyad-ai-theme', theme);
    localStorage.setItem('eyad-ai-lang', language);
    localStorage.setItem('eyad-ai-voice', voice);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12 lg:p-16 space-y-16">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-200 dark:border-slate-800 pb-12">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black flex items-center gap-5 tracking-tighter dark:text-white">
            <SettingsIcon className="text-blue-500 w-12 h-12" />
            {t('preferences')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
            تحكم في تجربة إياد الخاصة بك. التصميم الآن أصبح أكثر توازناً ووضوحاً.
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <button
            onClick={saveSettings}
            className={`px-10 py-4 rounded-2xl font-black flex items-center gap-4 transition-all text-xl shadow-lg ${
              saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {saved ? <Check className="w-6 h-6" /> : <Save className="w-6 h-6" />}
            {saved ? 'Saved!' : t('saveChanges')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Info */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center gap-4 text-blue-600">
              <ShieldCheck className="w-8 h-8" />
              <h3 className="font-black uppercase tracking-widest text-xs">System Health</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              تأكد من استقرار اتصالك بخوادم إياد للحصول على أفضل أداء.
            </p>
            
            <div className={`p-6 rounded-2xl border ${
              diagnostic.status === 'ok' ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
            }`}>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Diagnostic Status</p>
              <p className="text-lg font-bold dark:text-white mb-6">{diagnostic.message || 'No tests run yet.'}</p>
              <button onClick={runDiagnostic} className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                {diagnostic.status === 'checking' ? 'Testing...' : 'Start Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:col-span-8 space-y-12">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-16">
            
            {/* Appearance Section */}
            <section className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
                <Sun className="w-5 h-5" /> {t('appearance')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setTheme(Theme.LIGHT)}
                  className={`p-8 rounded-2xl border-2 transition-all flex items-center gap-5 ${theme === Theme.LIGHT ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
                >
                  <Sun className="w-10 h-10" />
                  <span className="text-2xl font-black">Light Mode</span>
                </button>
                <button
                  onClick={() => setTheme(Theme.DARK)}
                  className={`p-8 rounded-2xl border-2 transition-all flex items-center gap-5 ${theme === Theme.DARK ? 'border-blue-600 bg-slate-800 text-white' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <Moon className="w-10 h-10" />
                  <span className="text-2xl font-black">Dark Mode</span>
                </button>
              </div>
            </section>

            {/* Language Section */}
            <section className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
                <Globe className="w-5 h-5" /> {t('systemLang')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: Language.EN, label: 'English' },
                  { id: Language.AR, label: 'العربية' },
                  { id: Language.DIALECT, label: 'اللهجات' },
                  { id: Language.FR, label: 'Français' },
                  { id: Language.ES, label: 'Español' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`p-4 rounded-xl border-2 transition-all font-black text-sm ${
                      language === lang.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-md' 
                        : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Voice Section */}
            <section className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
                <Volume2 className="w-5 h-5" /> {t('voiceProfile')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {VOICE_IDS.map(vid => (
                  <button
                    key={vid}
                    onClick={() => setVoice(vid)}
                    className={`p-6 rounded-2xl border-2 transition-all font-black text-lg text-center ${
                      voice === vid 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-md scale-105' 
                        : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {t(vid)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
