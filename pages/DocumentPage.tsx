
import React, { useState } from 'react';
import { 
  Book, 
  Download, 
  Loader2, 
  Sparkles, 
  Search,
  BookOpen,
  Library,
  Scroll,
  ArrowRight,
  Globe,
  Quote,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateText } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const DocumentPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [depth, setDepth] = useState('standard');
  const [useSearch, setUseSearch] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ title: string; body: string; source: string; wisdom: string } | null>(null);
  const t = useTranslation();

  const handleConsult = async () => {
    if (!question.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAnswer(null);

    const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
    const langNames: Record<string, string> = {
      [Language.EN]: "English",
      [Language.AR]: "Standard Arabic",
      [Language.EG]: "Egyptian Arabic",
      [Language.FR]: "French",
      [Language.ES]: "Spanish"
    };
    const targetLang = langNames[currentLang as keyof typeof langNames] || "English";

    try {
      const prompt = `You are "Eyad Al-Alem", a moderate and highly knowledgeable Islamic scholar. 
      Answer this question accurately: "${question}".
      
      REQUIRED FORMAT:
      {
        "title": "A respectful title for the answer in ${targetLang}",
        "body": "A ${depth} detailed answer in ${targetLang}. Use Markdown for formatting (bold, lists). Must be clear and respectful.",
        "source": "The specific Verse/Hadith number and collection name used in ${targetLang} (e.g. Surat Al-Baqarah: 255)",
        "wisdom": "A short, beautiful spiritual reflection related to the topic in ${targetLang}"
      }
      
      Ensure authenticity from Quran and Sahih Sunnah.`;

      const response = await generateText(prompt, { 
        useSearch: useSearch,
        responseMimeType: "application/json",
        systemInstruction: "You are Eyad Al-Alem, a virtual Islamic guide who provides verified knowledge from the Quran and Sunnah. You prioritize authenticity. You MUST respond with a valid JSON object only."
      });
      
      try {
        const parsed = JSON.parse(response);
        setAnswer(parsed);
      } catch (parseError) {
        // Fallback: try to find JSON block manually if parsing fails
        const startIdx = response.indexOf('{');
        const endIdx = response.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = response.substring(startIdx, endIdx + 1);
          setAnswer(JSON.parse(jsonStr));
        } else {
          throw new Error("Could not parse response");
        }
      }
    } catch (err: any) {
      console.error("Islamic Hub Error:", err);
      setError(currentLang === Language.AR || currentLang === Language.EG 
        ? "عذراً، حدث خطأ أثناء الاتصال بالمصادر. جرب إيقاف وضع البحث أو المحاولة لاحقاً." 
        : "Sorry, an error occurred while connecting to sources. Try turning off Search or try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAnswer = () => {
    if (!answer) return;
    const content = `Eyad AI - Islamic Knowledge\n\nQuestion: ${question}\n\nAnswer:\n${answer.body}\n\nSource: ${answer.source}\n\nReflection: ${answer.wisdom}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eyad-Islamic-Knowledge.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 bg-emerald-50/20 dark:bg-transparent min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-14 border border-emerald-100 dark:border-slate-800 shadow-2xl relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
              <Library className="w-4 h-4" /> Authenticated Islamic Knowledge
            </div>
            <h1 className="text-4xl md:text-6xl font-black dark:text-white tracking-tighter flex flex-col md:flex-row items-center gap-4">
              <Book className="text-emerald-600 w-12 h-12" />
              {t('docTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl">{t('docSubTitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">{t('docTopicLabel')}</label>
                <div className="relative group">
                  <Search className="absolute left-6 top-6 w-6 h-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t('docTopicPlaceholder')}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-600/20 rounded-[2rem] outline-none text-slate-900 dark:text-white font-bold text-xl shadow-inner transition-all min-h-[140px] resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setUseSearch(!useSearch)}
                  className={`flex-grow py-5 rounded-2xl font-black flex items-center justify-center gap-3 border-2 transition-all ${useSearch ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  <Globe className="w-5 h-5" />
                  {useSearch ? t('googleSearchActive') : t('offlineMode')}
                </button>
                <button
                  onClick={handleConsult}
                  disabled={isGenerating || !question.trim()}
                  className="flex-[2] py-5 bg-emerald-700 text-white rounded-2xl font-black text-xl hover:bg-emerald-800 shadow-2xl shadow-emerald-700/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7 fill-white" />}
                  {isGenerating ? (useSearch ? "Searching web..." : t('generatingDoc')) : t('startBuilding')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <label className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">{t('docLengthLabel')}</label>
              <div className="space-y-3">
                {[
                  { id: 'short', label: t('shortArticle'), icon: Scroll },
                  { id: 'standard', label: t('standardResearch'), icon: BookOpen },
                  { id: 'detailed', label: t('detailedReport'), icon: Library }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDepth(opt.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold ${depth === opt.id ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon className="w-5 h-5" />
                      <span>{opt.label}</span>
                    </div>
                    {depth === opt.id && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Area */}
      {answer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 border border-emerald-100 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-8">
              <h2 className="text-3xl font-black dark:text-white leading-tight">{answer.title}</h2>
              <button onClick={downloadAnswer} className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                <Download className="w-6 h-6" />
              </button>
            </div>
            <div className="prose prose-xl dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap dark:text-slate-300 text-slate-700 font-medium leading-relaxed font-serif">
                {answer.body}
              </div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 flex gap-6">
              <Quote className="w-10 h-10 text-emerald-600 flex-shrink-0 opacity-50" />
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t('theorySection')}</span>
                <p className="text-emerald-800 dark:text-emerald-200 font-black text-lg italic">{answer.source}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <div className="p-4 bg-white/10 rounded-2xl w-fit">
                  <Lightbulb className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{t('proTip')}</h3>
                <p className="text-emerald-50 font-medium text-lg italic leading-relaxed">"{answer.wisdom}"</p>
                <div className="pt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
                  <Sparkles className="w-3 h-3" /> Spiritual Wisdom
                </div>
              </div>
              <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
               <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Recent Enquiries</h4>
               <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                        {i}
                      </div>
                      <div className="flex-grow">
                         <p className="text-sm font-bold dark:text-white truncate">The virtues of Salah...</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase">Eyad Guide</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
