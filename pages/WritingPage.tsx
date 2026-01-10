
import React, { useState } from 'react';
import { 
  PenTool, 
  Wand2, 
  Languages, 
  Check, 
  Copy, 
  Loader2, 
  Book, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { generateText, extractJson } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

type ToolMode = 'grammar' | 'generator' | 'irab';

export const WritingPage = () => {
  const [mode, setMode] = useState<ToolMode>('grammar');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  const [genTopic, setGenTopic] = useState('');
  const [genLength, setGenLength] = useState('long'); 

  const [grammarResult, setGrammarResult] = useState<{corrected: string, changes: string[]} | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [irabResult, setIrabResult] = useState<{word: string, analysis: string}[] | null>(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);
    setGrammarResult(null);
    setGenResult(null);
    setIrabResult(null);

    const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
    const isRTL = currentLang === Language.AR || currentLang === Language.EG;
    
    try {
      if (mode === 'grammar') {
        if (!input.trim()) return;
        const prompt = `Act as a professional multi-language editor. Correct the grammar, spelling, and punctuation of the following text. 
        Input text: "${input}"
        
        Output ONLY a valid JSON object:
        {
          "corrected": "The fully corrected text here",
          "changes": ["Brief description of changes"]
        }
        Do not include markdown code blocks.`;
        
        const res = await generateText(prompt, { systemInstruction: "You are a professional editor. You only output valid JSON." });
        const json = extractJson(res.text);
        setGrammarResult(json);

      } else if (mode === 'generator') {
        if (!genTopic.trim()) return;
        const lengthPrompt = genLength === 'long' 
          ? "CRITICAL: The article MUST be extremely detailed, extensive, and aim for 3000+ words." 
          : "Write a standard professional article.";
          
        const prompt = `Act as a world-class author. Write a content piece about: "${genTopic}".
        ${lengthPrompt}
        Language: Detect from topic or use ${currentLang}.
        Format: Markdown (Use # Headings, ## Subheadings).
        Style: Professional and authoritative.`;

        const res = await generateText(prompt, { systemInstruction: "You are a long-form content creator." });
        setGenResult(res.text);

      } else if (mode === 'irab') {
        if (!input.trim()) return;
        const prompt = `Act as an expert Arabic Linguist (نحوي). Parse the following Arabic sentence word by word (إعراب مفصل).
        Sentence: "${input}"
        
        Output ONLY a valid JSON array:
        [
          { "word": "الكلمة", "analysis": "الإعراب التفصيلي" }
        ]
        Do not include markdown code blocks or any other text. Only the array.`;

        const res = await generateText(prompt, { systemInstruction: "You are an expert Arabic grammarian. You only output JSON arrays." });
        const json = extractJson(res.text);
        
        if (!Array.isArray(json)) {
          throw new Error("INVALID_IRAB_FORMAT");
        }
        setIrabResult(json);
      }
    } catch (e: any) {
      console.error(e);
      let errorMsg = isRTL 
        ? "عذراً، حدث خطأ أثناء التحليل. يرجى التأكد من الجملة والمحاولة مرة أخرى."
        : "Sorry, an error occurred during analysis. Please check your input and try again.";
      
      if (e.message === "API_KEY_MISSING") {
        errorMsg = isRTL ? "مفتاح API مفقود. يرجى مراجعة الإعدادات." : "API Key is missing. Check settings.";
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 min-h-screen space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
          <PenTool className="w-3.5 h-3.5" /> {t('writingTitle')}
        </div>
        <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter">
          {t('writing')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-lg">
          {t('writingSubTitle')}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { id: 'grammar', label: t('tabGrammar'), icon: Check },
          { id: 'generator', label: t('tabGenerator'), icon: Wand2 },
          { id: 'irab', label: t('tabIrab'), icon: Languages },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { 
              setMode(tab.id as ToolMode); 
              setError(null);
              setInput(''); 
              setGenTopic(''); 
              setGrammarResult(null); 
              setGenResult(null); 
              setIrabResult(null); 
            }}
            className={`px-6 py-4 rounded-2xl flex items-center gap-3 font-bold transition-all border-2 ${
              mode === tab.id 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
        <div className="space-y-6">
          {mode === 'grammar' && (
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('grammarLabel')}</label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('grammarPlaceholder')}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[200px] text-lg font-medium dark:text-white resize-none"
              />
            </div>
          )}

          {mode === 'generator' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('genTopicLabel')}</label>
                <input 
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder={t('genTopicPlaceholder')}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-indigo-500/10 text-xl font-bold dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('genLengthLabel')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'short', label: t('genShort') },
                    { id: 'medium', label: t('genMedium') },
                    { id: 'long', label: t('genLong') }
                  ].map(l => (
                    <button 
                      key={l.id} 
                      onClick={() => setGenLength(l.id)}
                      className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${genLength === l.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'irab' && (
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('irabLabel')}</label>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                placeholder={t('irabPlaceholder')}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none outline-none focus:ring-4 focus:ring-indigo-500/10 text-2xl font-bold text-center dark:text-white font-serif"
                dir="rtl"
              />
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={isLoading || (mode !== 'generator' && !input) || (mode === 'generator' && !genTopic)}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {isLoading ? t('processing') : mode === 'grammar' ? t('fixButton') : mode === 'generator' ? t('genButton') : t('irabButton')}
          </button>
        </div>

        {error && (
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {(grammarResult || genResult || irabResult) && (
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8">
            {grammarResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('resultOriginal')}</h3>
                   <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 text-slate-600 dark:text-slate-300 leading-relaxed line-through decoration-red-400/50">
                     {input}
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h3 className="font-black text-green-600 uppercase tracking-widest text-xs">{t('resultCorrected')}</h3>
                     <button onClick={() => copyToClipboard(grammarResult.corrected)} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"> {t('copyText')}</button>
                   </div>
                   <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-900/30 text-slate-800 dark:text-white font-medium leading-relaxed">
                     {grammarResult.corrected}
                   </div>
                   {grammarResult.changes.length > 0 && (
                     <div className="pt-4">
                        <p className="text-xs font-bold text-slate-400 mb-2">{t('changesLog')}</p>
                        <ul className="space-y-1">
                          {grammarResult.changes.map((c, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span> {c}
                            </li>
                          ))}
                        </ul>
                     </div>
                   )}
                </div>
              </div>
            )}

            {genResult && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-black text-slate-900 dark:text-white text-2xl">{genTopic}</h3>
                    <button onClick={() => copyToClipboard(genResult)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-2">
                       {t('copyText')}
                    </button>
                 </div>
                 <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-p:font-medium prose-p:leading-loose">
                    <div className="whitespace-pre-wrap">{genResult}</div>
                 </div>
              </div>
            )}

            {irabResult && (
               <div className="space-y-6">
                 <div className="flex items-center gap-3 justify-center mb-8">
                   <Book className="w-6 h-6 text-indigo-600" />
                   <h3 className="text-xl font-black dark:text-white">{input}</h3>
                 </div>
                 <div className="grid gap-3">
                   {irabResult.map((item, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row md:items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                       <div className="md:w-32 font-black text-indigo-600 text-lg mb-2 md:mb-0">{item.word}</div>
                       <div className="flex-grow font-medium text-slate-700 dark:text-slate-300 font-serif text-lg">{item.analysis}</div>
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
