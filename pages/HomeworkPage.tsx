
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
  Lightbulb
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
      const systemInstruction = `You are Eyad AI, a top-tier educational engineer.
      Subject context: ${selectedSubject}
      Instructional Style: ${tutorType}
      User Language: ${currentLang}
      
      TASK: Solve the problem provided. 
      If there is an image, prioritize its content.
      
      OUTPUT RULES:
      1. ONLY return a valid JSON object.
      2. Format: {"summary": "Direct result", "steps": ["Full process 1", "Full process 2", ...], "theory": "Scientific concepts", "tip": "Expert hint"}
      3. Use ${currentLang} for all text values.
      4. DO NOT wrap in markdown code blocks.`;

      const userPrompt = question.trim() ? question : "Solve this problem from the image carefully.";
      
      const res = await generateText(userPrompt, { 
        systemInstruction,
        image: image || undefined 
      });

      const json = extractJson(res.text) as SolutionData;
      
      if (!json.summary || !json.steps) {
        throw new Error("INVALID_FORMAT");
      }
      
      setSolution(json);
    } catch (e: any) {
      console.error("Homework Solve Error:", e);
      let msg = currentLang === Language.AR || currentLang === Language.EG 
        ? "حصلت مشكلة وأنا بحل المسألة. اتأكد إن الصورة واضحة أو إن مفتاح الـ API شغال."
        : "Something went wrong while solving. Ensure the image is clear or your API key is valid.";
      
      if (e.message?.includes('API_KEY')) msg = "API Key Error. Please check settings.";
      setError(msg);
    } finally {
      setIsSolving(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage({ data: base64, mimeType: file.type });
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 md:p-10 space-y-10 min-h-screen transition-all duration-500`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
        <div className="p-3 bg-blue-600/10 rounded-2xl">
          <GraduationCap className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
          {t('homework')}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {t('solve')} — Optimized for speed and accuracy in multiple languages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                {t('subjectLabel')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub.id)}
                    className={`group p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-start ${
                      selectedSubject === sub.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-lg' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    <sub.icon className={`w-6 h-6 transition-transform group-hover:scale-110`} />
                    <span className="text-xs font-black truncate">{sub.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                {t('selectTutor')}
              </h3>
              <div className="space-y-2">
                {tutorTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTutorType(type.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      tutorType === type.id 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${tutorType === type.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="flex-grow">{type.label}</span>
                    {tutorType === type.id && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="space-y-8">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('hwPlaceholder')}
                  className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] outline-none text-slate-900 dark:text-white font-bold text-xl min-h-[180px] resize-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                />
                <div className="absolute top-4 right-4 text-slate-300 pointer-events-none">
                  <Brain className="w-8 h-8 opacity-20" />
                </div>
              </div>

              {image && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="relative group rounded-3xl overflow-hidden border-4 border-blue-600/20 aspect-video bg-black/90">
                    <img 
                      src={`data:${image.mimeType};base64,${image.data}`} 
                      className="w-full h-full object-contain" 
                      alt="Attachment" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={() => setImage(null)}
                        className="p-4 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                       >
                        <X className="w-6 h-6" />
                       </button>
                    </div>
                    <div className="absolute bottom-4 left-4 px-4 py-2 bg-blue-600/80 text-white text-xs font-black rounded-xl backdrop-blur-md">
                      {t('imageAttached')}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleSolve} 
                  disabled={isSolving || (!question.trim() && !image)} 
                  className="flex-grow px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSolving ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7 fill-white" />}
                  {isSolving ? t('processing') : t('hwSolve')}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-[2.5rem] font-bold flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="uppercase text-xs font-black tracking-widest opacity-60">System Notification</p>
                <p className="text-lg leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {solution && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-200" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{t('solutionTitle')}</h3>
                  </div>
                  <p className="text-3xl font-black leading-tight">{solution.summary}</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
                <h3 className="text-slate-400 font-black flex items-center gap-3 uppercase tracking-widest text-xs">
                  <Repeat className="w-5 h-5 text-blue-600" /> {t('stepsTitle')}
                </h3>
                <div className="space-y-8">
                  {solution.steps.map((step, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-blue-600 flex items-center justify-center text-lg font-black flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                        {i + 1}
                      </div>
                      <p className="text-xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <Atom className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-widest text-xs">{t('theoryTitle')}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{solution.theory}</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <Lightbulb className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-widest text-xs">{t('tipTitle')}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{solution.tip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
