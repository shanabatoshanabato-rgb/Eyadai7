
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Volume2, Globe, Save, Check, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { Language, Theme } from '../types';
import { VOICES, DEFAULT_SETTINGS } from '../constants';
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

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem('eyad-ai-theme', newTheme);
  };

  const runDiagnostic = async () => {
    setDiagnostic({ status: 'checking', message: 'Testing connection to Google AI...' });
    try {
      const response = await generateText("Say only 'API is working' to test connection.");
      if (response && response.text) {
        setDiagnostic({ status: 'ok', message: 'API is working perfectly! Eyad is ready.' });
      } else {
        setDiagnostic({ status: 'fail', message: 'API returned empty response.' });
      }
    } catch (e: any) {
      console.error(e);
      const isMissing = e.message?.includes("API_KEY_MISSING");
      setDiagnostic({ 
        status: 'fail', 
        message: isMissing 
          ? 'API Key is missing. If on Vercel, add API_KEY to Environment Variables and redeploy.' 
          : `Connection Failed: ${e.message}` 
      });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('eyad-ai-theme', theme);
    localStorage.setItem('eyad-ai-lang', language);
    localStorage.setItem('eyad-ai-voice', voice);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (language !== localStorage.getItem('eyad-ai-lang')) {
         window.location.reload();
      }
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <div className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        diagnostic.status === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
        diagnostic.status === 'fail' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
        'bg-blue-600/5 border-blue-600/10 text-blue-600'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${diagnostic.status === 'ok' ? 'bg-green-500 text-white' : diagnostic.status === 'fail' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
            {diagnostic.status === 'ok' ? <ShieldCheck /> : diagnostic.status === 'fail' ? <ShieldAlert /> : <Activity />}
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest">System Health</p>
            <p className="text-sm font-bold opacity-80 leading-tight">{diagnostic.message || 'Check connection status'}</p>
          </div>
        </div>
        <button 
          onClick={runDiagnostic}
          disabled={diagnostic.status === 'checking'}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-current rounded-xl text-xs font-black uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
        >
          {diagnostic.status === 'checking' ? 'Testing...' : 'Test API'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter dark:text-white">
            <SettingsIcon className="text-blue-500 w-8 h-8" />
            {t('preferences')}
          </h2>
          <button
            onClick={saveSettings}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
            {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saved ? 'Saved!' : t('saveChanges')}
          </button>
        </div>

        <div className="space-y-10">
          {/* Theme Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Sun className="w-4 h-4" /> {t('appearance')}
            </h3>
            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {theme === Theme.DARK ? <Moon className="text-blue-400" /> : <Sun className="text-orange-400" />}
                <div>
                  <p className="font-black dark:text-white">{theme === Theme.DARK ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-sm text-slate-500 font-medium">Switch visual theme</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-16 h-9 flex items-center rounded-full p-1 transition-colors ${theme === Theme.DARK ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-7 h-7 rounded-full shadow-lg transform transition-transform ${theme === Theme.DARK ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>

          {/* Language Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t('systemLang')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: Language.EN, label: 'English' },
                { id: Language.AR, label: 'العربية' },
                { id: Language.EG, label: 'مصري' },
                { id: Language.FR, label: 'Français' },
                { id: Language.ES, label: 'Español' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center font-bold text-sm ${
                    language === lang.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </section>

          {/* Voice Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> {t('voiceProfile')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map(v => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center font-bold text-sm ${
                    voice === v
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
