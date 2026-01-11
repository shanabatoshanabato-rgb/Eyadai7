
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
  AlertCircle,
  Type,
  Lightbulb
} from 'lucide-react';
import { generateText, extractJson } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

type ToolMode = 'grammar' | 'generator' | 'irab' | 'vocabulary';

interface VocabResult {
  corrected: string;
  isCorrect: boolean;
  alternatives: string[];
  explanation: string;
}

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
  const [vocabResult, setVocabResult] = useState<VocabResult | null>(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);
    setGrammarResult(null);
    setGenResult(null);
    setIrabResult(null);
    setVocabResult(null);

    const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
    const isRTL = currentLang === Language.AR || currentLang === Language.DIALECT;
    
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
      } else if (mode === 'vocabulary') {
        if (!input.trim()) return;
        const prompt = `Analyze the spelling and vocabulary of the following text: "${input}". 
        Check if it's correct. If wrong, correct it. Also suggest 3 better/more professional alternatives.
        Language: ${currentLang}.

        Output ONLY a valid JSON object:
        {
          "corrected": "Correct spelling/form",
          "isCorrect": true/false,
          "alternatives": ["Alt 1", "Alt 2", "Alt 3"],
          "explanation": "Brief note about why this change was suggested or what the word means"
        }`;

        const res = await generateText(prompt, { systemInstruction: "You are a vocabulary expert. You only output valid JSON." });
        const json = extractJson(res.text);
        setVocabResult(json);
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
    <div className="max-w-6xl mx-auto p-4 md:p-10 min-h-screen space-y-12">
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

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {[
          { id: 'grammar', label: t('tabGrammar'), icon: Check },
          { id: 'vocabulary', label: t('tabVocab'), icon: Type },
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
              setVocabResult(null);
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

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
        <div className="space-y-12">
          {(mode === 'grammar' || mode === 'vocabulary') && (
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">
                {mode === 'grammar' ? t('grammarLabel') : t('vocabLabel')}
              </label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'grammar' ? t('grammarPlaceholder') : t('vocabPlaceholder')}
                className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-none outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[220px] text-lg font-medium dark:text-white resize-none shadow-inner"
              />
            </div>
          )}

          {mode === 'generator' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">{t('genTopicLabel')}</label>
                <input 
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder={t('genTopicPlaceholder')}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-indigo-500/10 text-xl font-bold dark:text-white shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">{t('genLengthLabel')}</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'short', label: t('genShort') },
                    { id: 'medium', label: t('genMedium') },
                    { id: 'long', label: t('genLong') }
                  ].map(l => (
                    <button 
                      key={l.id} 
                      onClick={() => setGenLength(l.id)}
                      className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${genLength === l.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">{t('irabLabel')}</label>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                placeholder={t('irabPlaceholder')}
                className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-none outline-none focus:ring-4 focus:ring-indigo-500/10 text-2xl font-bold text-center dark:text-white font-serif shadow-inner"
                dir="rtl"
              />
            </div>
          )}

          <div className="pt-8 mb-8">
            <button
              onClick={handleAction}
              disabled={isLoading || (mode !== 'generator' && !input) || (mode === 'generator' && !genTopic)}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7 fill-white" />}
              {isLoading ? t('processing') : mode === 'grammar' ? t('tabGrammar') : mode === 'vocabulary' ? t('tabVocab') : mode === 'generator' ? t('tabGenerator') : t('tabIrab')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-12 p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-[2rem] flex items-center gap-4 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-7 h-7 flex-shrink-0" />
            <p className="font-black text-lg">{error}</p>
          </div>
        )}

        {(grammarResult || genResult || irabResult || vocabResult) && (
          <div className="mt-20 pt-16 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8 space-y-16">
            {grammarResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                   <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs px-2">{t('resultOriginal')}</h3>
                   <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/30 text-slate-600 dark:text-slate-300 leading-relaxed line-through decoration-red-400/50 text-lg">
                     {input}
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                     <h3 className="font-black text-green-600 uppercase tracking-widest text-xs">{t('resultCorrected')}</h3>
                     <button onClick={() => copyToClipboard(grammarResult.corrected)} className="text-indigo-600 text-xs font-black flex items-center gap-2 hover:underline bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-all"> <Copy size={14}/> {t('copyText')}</button>
                   </div>
                   <div className="p-8 bg-green-50 dark:bg-green-900/10 rounded-[2rem] border border-green-100 dark:border-green-900/30 text-slate-800 dark:text-white font-bold leading-relaxed text-lg">
                     {grammarResult.corrected}
                   </div>
                   {grammarResult.changes.length > 0 && (
                     <div className="pt-6 px-2">
                        <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">{t('changesLog')}</p>
                        <ul className="space-y-3">
                          {grammarResult.changes.map((c, i) => (
                            <li key={i} className="text-base text-slate-600 dark:text-slate-400 flex items-start gap-3 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/[0.05]">
                              <span className="mt-2 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span> {c}
                            </li>
                          ))}
                        </ul>
                     </div>
                   )}
                </div>
              </div>
            )}

            {vocabResult && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs px-2">{t('resultOriginal')}</h3>
                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-lg">
                      {input}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-black text-green-600 uppercase tracking-widest text-xs px-2">{vocabResult.isCorrect ? "Perfectly Spelled" : t('resultCorrected')}</h3>
                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black text-2xl">
                      {vocabResult.corrected}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs px-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" /> Better Alternatives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {vocabResult.alternatives.map((alt, i) => (
                      <button 
                        key={i} 
                        onClick={() => copyToClipboard(alt)}
                        className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left font-black text-slate-800 dark:text-white flex justify-between items-center group shadow-sm"
                      >
                        {alt}
                        <Copy className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                  <div className="p-8 bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 text-base text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                    {vocabResult.explanation}
                  </div>
                </div>
              </div>
            )}

            {genResult && (
              <div className="space-y-10">
                 <div className="flex justify-between items-center px-2">
                    <h2 className="text-3xl font-black dark:text-white tracking-tight">{genTopic}</h2>
                    <button onClick={() => copyToClipboard(genResult)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg shadow-indigo-600/20">
                       <Copy size={16}/> {t('copyText')}
                    </button>
                 </div>
                 <div className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-black prose-p:font-bold prose-p:leading-loose bg-slate-50 dark:bg-white/[0.02] p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/[0.05] shadow-inner">
                    <div className="whitespace-pre-wrap">{genResult}</div>
                 </div>
              </div>
            )}

            {irabResult && (
               <div className="space-y-12">
                 <div className="flex items-center gap-4 justify-center mb-10">
                   <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                    <Book className="w-8 h-8" />
                   </div>
                   <h3 className="text-3xl font-black dark:text-white font-serif">{input}</h3>
                 </div>
                 <div className="grid gap-6 max-w-4xl mx-auto">
                   {irabResult.map((item, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row md:items-center bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group shadow-sm hover:shadow-md">
                       <div className="md:w-48 font-black text-indigo-600 text-2xl mb-4 md:mb-0 font-serif border-l-4 border-indigo-600/20 pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pr-4">{item.word}</div>
                       <div className="flex-grow font-bold text-slate-700 dark:text-slate-200 font-serif text-xl leading-relaxed">{item.analysis}</div>
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
