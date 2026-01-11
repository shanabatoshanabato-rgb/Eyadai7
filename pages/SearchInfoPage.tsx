
import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Sparkles, 
  Loader2, 
  ExternalLink, 
  Link as LinkIcon,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { generateText } from '../services/geminiService';
import { useTranslation } from '../translations';
import { MODELS } from '../constants';
import { Language } from '../types';

export const SearchInfoPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    setError(null);
    setResult(null);

    const currentLang = localStorage.getItem('eyad-ai-lang') || 'ar';
    const isArabic = currentLang === Language.AR || currentLang === Language.DIALECT;

    try {
      // Optimized prompt for Free Tier: Requests concise answers to save TPM (Tokens Per Minute)
      const systemInstruction = `You are Eyad AI Encyclopedia. 
      - Your task: Search Google and provide a summarized, accurate answer.
      - CRITICAL: Keep your answer CONCISE and direct to save resources. 
      - Do not hallucinate. Use only the provided search results.
      - Answer in the user's language.`;

      const response = await generateText(query, {
        useSearch: true,
        model: MODELS.GENERAL, 
        systemInstruction,
        task: 'search'
      });
      
      setResult({
        text: response.text,
        sources: response.sources || []
      });
    } catch (err: any) {
      console.error(err);
      // specific handling for Free Tier limits
      if (err.message?.includes('429') || err.message?.includes('quota') || err.status === 429) {
        setError(isArabic 
          ? "⚠️ وصلت للحد الأقصى للخطة المجانية (Quota). انتظر دقيقة وحاول تاني." 
          : "⚠️ Free Tier Quota Exceeded. Please wait a minute and try again.");
      } else {
        setError(t('searchError'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 min-h-screen transition-colors duration-300">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
          <Globe className="w-3.5 h-3.5" /> Web Grounding Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-black dark:text-white tracking-tighter">
          {t('searchTitle')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
          {t('searchSubTitle')}
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 shadow-2xl transition-all group">
          <Search className="ml-6 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('searchPlaceholder')}
            className="flex-grow bg-transparent border-none outline-none p-4 text-xl font-bold dark:text-white placeholder:text-slate-400"
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-10 py-4 bg-blue-600 text-white rounded-[2.5rem] font-black text-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-blue-600/20"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
            {isSearching ? t('searching') : t('explore')}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-10">
            <div className="prose prose-xl dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-medium leading-[1.8] text-lg md:text-xl">
                {result.text}
              </div>
            </div>

            {result.sources.length > 0 && (
              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <LinkIcon className="w-4 h-4 text-blue-600" /> {t('sources')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group p-5 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-transparent hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.05] transition-all flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-black truncate dark:text-slate-200 mb-1">{s.title}</span>
                        <span className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">{new URL(s.uri).hostname}</span>
                      </div>
                      <div className="p-2 bg-blue-600/5 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] text-red-600 dark:text-red-400 text-center font-bold flex flex-col items-center gap-3 animate-in zoom-in">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-lg">{error}</p>
        </div>
      )}
    </div>
  );
};
