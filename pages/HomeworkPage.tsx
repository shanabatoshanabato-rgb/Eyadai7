
import React, { useState, useRef, useMemo } from 'react';
import { 
  Loader2, 
  Image as ImageIcon, 
  Brain, 
  GraduationCap, 
  Sparkles, 
  Zap, 
  Repeat, 
  Atom, 
  FlaskConical, 
  Microscope, 
  ScrollText, 
  Calculator, 
  Languages, 
  X,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ClipboardCheck,
  BookOpen
} from 'lucide-react';
import { generateText, extractJson } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

interface SolutionData {
  summary: string;
  steps: string[];
  theory: string;
  tip: string;
}

export const HomeworkPage: React.FC = () => {
  const t = useTranslation();
  const [question, setQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [tutorType, setTutorType] = useState('friendly');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
  const isRTL = currentLang === Language.AR || currentLang === Language.EG;

  const subjects = useMemo(() => [
    { id: 'math', label: t('math'), icon: Calculator, color: 'blue' },
    { id: 'physics', label: t('physics'), icon: Atom, color: 'indigo' },
    { id: 'chemistry', label: t('chemistry'), icon: FlaskConical, color: 'emerald' },
    { id: 'science', label: t('science'), icon: Microscope, color: 'purple' },
    { id: 'history', label: t('history'), icon: ScrollText, color: 'amber' },
    { id: 'arabic', label: t('arabic'), icon: Languages, color: 'rose' },
    { id: 'english', label: t('english'), icon: Languages, color: 'cyan' },
  ], [t]);

  const tutorTypes = useMemo(() => [
    { id: 'friendly', label: t('tutorFriendly'), icon: Sparkles },
    { id: 'strict', label: t('tutorStrict'), icon: GraduationCap },
    { id: 'genius', label: t('tutorGenius'), icon: Zap },
  ], [t]);

  const handleSolve = async () => {
    if (!question.trim() && !image) return;
    
    setIsSolving(true);
    setSolution(null);
    setError(null);
    
    try {
      // Prompt specifically designed to minimize latency and ensure valid JSON
      const systemInstruction = `You are Eyad AI, a world-class academic tutor.
      Target Subject: ${selectedSubject}
      Style: ${tutorType}
      Language: ${currentLang}
      
      CORE RULE: You MUST respond ONLY with a raw JSON object. Do not include markdown code blocks like \`\`\`json. 
      Do not include any text before or after the JSON.
      
      Required JSON Schema:
      {
        "summary": "The final direct answer",
        "steps": ["Logical step 1", "Logical step 2", "..."],
        "theory": "One sentence explaining the concept used",
        "tip": "A helpful mnemonic or advice"
      }
      
      Ensure all values are in ${currentLang}. If image is present, analyze it first.`;

      const userPrompt = question.trim() ? question : "Analyze this homework problem and provide a detailed solution in the requested JSON format.";
      
      const res = await generateText(userPrompt, { 
        systemInstruction,
        image: image || undefined 
      });

      if (!res.text || res.text.trim().length === 0) {
        throw new Error("EMPTY_RESPONSE");
      }

      const json = extractJson(res.text) as SolutionData;
      
      // Validation check
      if (!json.summary || !Array.isArray(json.steps)) {
        throw new Error("INVALID_JSON_STRUCTURE");
      }
      
      setSolution(json);
    } catch (e: any) {
      console.error("Homework Solve Failed:", e);
      let msg = "";
      
      if (currentLang === Language.AR || currentLang === Language.EG) {
        msg = "معلش حصلت مشكلة وأنا بحل المسألة. اتأكد إن السؤال واضح أو الصورة مش مهزوزة، وجرب تاني.";
      } else {
        msg = "I encountered an error while solving. Please ensure the question is clear and try again.";
      }
      
      if (e.message === "API_KEY_MISSING") msg = "API Key Error. Check settings.";
      if (e.message === "EMPTY_RESPONSE") msg = "Received an empty response. Re-trying might help.";
      
      setError(msg);
    } finally {
      setIsSolving(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError(isRTL ? "حجم الصورة كبير أوي. أقصى حجم 4 ميجا." : "Image too large. Max 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage({ data: base64, mimeType: file.type });
        setError(null);
        setSolution(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Dynamic Title Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-blue-600/10 rounded-3xl border border-blue-600/20">
          <BookOpen className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
          {t('homework')}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
          {t('solve')} — Multi-subject intelligence at your fingertips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} /> {t('subjectLabel')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => { setSelectedSubject(sub.id); setSolution(null); }}
                    className={`flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all group ${
                      selectedSubject === sub.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-lg' 
                        : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <sub.icon className={`w-6 h-6 transition-transform group-hover:scale-110`} />
                    <span className="text-xs font-black truncate w-full">{sub.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} /> {t('selectTutor')}
              </h3>
              <div className="space-y-2">
                {tutorTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => { setTutorType(type.id); setSolution(null); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      tutorType === type.id 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' 
                        : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-indigo-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${tutorType === type.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="flex-grow text-left rtl:text-right">{type.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Workspace Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); setError(null); }}
                placeholder={t('hwPlaceholder')}
                className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] outline-none text-slate-900 dark:text-white font-bold text-xl min-h-[220px] resize-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
              />
              <div className="absolute bottom-6 right-6 flex gap-3">
                 <Brain className="w-8 h-8 text-blue-600/20" />
              </div>
            </div>

            {image && (
              <div className="relative group rounded-[2rem] overflow-hidden border-4 border-blue-600/20 bg-slate-100 dark:bg-slate-800 aspect-[16/9] animate-in zoom-in duration-300">
                <img 
                  src={`data:${image.mimeType};base64,${image.data}`} 
                  className="w-full h-full object-contain" 
                  alt="Attachment" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => setImage(null)}
                    className="p-5 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-2xl"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
                <div className="absolute top-4 left-4 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                  {t('imageAttached')}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-md active:scale-95"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="hidden sm:inline">Attach Photo</span>
              </button>
              <button 
                onClick={handleSolve} 
                disabled={isSolving || (!question.trim() && !image)} 
                className="flex-grow px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 shadow-xl shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSolving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8 fill-white" />}
                {isSolving ? t('processing') : t('hwSolve')}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-[2.5rem] font-bold flex items-start gap-4 animate-in slide-in-from-top-4">
              <AlertCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="uppercase text-[10px] font-black tracking-widest opacity-60">System Notice</p>
                <p className="text-lg leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {solution && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
              {/* Summary Hero Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-200" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{t('solutionTitle')}</h3>
                  </div>
                  <p className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
                    {solution.summary}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              </div>

              {/* Detailed Steps Bento Block */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-400 font-black flex items-center gap-3 uppercase tracking-widest text-[10px]">
                    <Repeat className="w-5 h-5 text-blue-600" /> {t('stepsTitle')}
                  </h3>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase">
                    {solution.steps.length} Steps Found
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-10">
                  {solution.steps.map((step, i) => (
                    <div key={i} className="flex gap-8 items-start group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 flex items-center justify-center text-xl font-black flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500 shadow-sm">
                        {i + 1}
                      </div>
                      <div className="space-y-2 pt-1">
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                          {step}
                        </p>
                        <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:w-full group-hover:bg-blue-600/30 transition-all duration-1000"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context Footer Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-10 rounded-[3rem] border border-indigo-100 dark:border-indigo-900/50 space-y-5">
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <Atom className="w-7 h-7" />
                    <h3 className="font-black uppercase tracking-widest text-[10px]">{t('theoryTitle')}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-bold text-lg leading-relaxed">
                    {solution.theory}
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-10 rounded-[3rem] border border-emerald-100 dark:border-emerald-900/50 space-y-5">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <Lightbulb className="w-7 h-7" />
                    <h3 className="font-black uppercase tracking-widest text-[10px]">{t('tipTitle')}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-bold text-lg leading-relaxed italic">
                    {solution.tip}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-90 transition-opacity shadow-xl"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Save Solution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
