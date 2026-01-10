
import React, { useState, useRef, useMemo } from 'react';
import { 
  BookOpen, Loader2, Image as ImageIcon, 
  Brain, GraduationCap, Sparkles, Zap, Repeat, 
  Atom, FlaskConical, Microscope, ScrollText, Calculator, Languages, X,
  AlertTriangle
} from 'lucide-react';
import { generateText, extractJson } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const HomeworkPage = () => {
  const t = useTranslation();
  const [question, setQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [tutorType, setTutorType] = useState('friendly');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
  const isRTL = currentLang === Language.AR || currentLang === Language.EG;

  const subjects = useMemo(() => [
    { id: 'math', label: t('math'), icon: Calculator },
    { id: 'physics', label: t('physics'), icon: Atom },
    { id: 'chemistry', label: t('chemistry'), icon: FlaskConical },
    { id: 'science', label: t('science'), icon: Microscope },
    { id: 'history', label: t('history'), icon: ScrollText },
    { id: 'arabic', label: t('arabic'), icon: Languages },
    { id: 'english', label: t('english'), icon: Languages },
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
      const systemInstruction = `You are Eyad AI, an expert tutor. 
      Subject: ${selectedSubject}. 
      Tutor Style: ${tutorType}. 
      Target Language Code: ${currentLang}. 
      Task: Solve the problem provided in text or image.
      
      CRITICAL INSTRUCTIONS:
      1. You MUST respond ONLY with a raw JSON object.
      2. Do NOT use markdown code blocks (no \`\`\`json).
      3. Do NOT add any introductory text.
      
      JSON Structure:
      {
        "summary": "Brief direct answer",
        "steps": ["Step 1", "Step 2", ...],
        "theory": "Concept/Rule used",
        "tip": "Helpful hint"
      }`;

      const userPrompt = question.trim() ? question : "Solve this problem shown in the image step by step.";
      
      const res = await generateText(userPrompt, { 
        systemInstruction,
        image: image || undefined 
      });

      const json = extractJson(res.text);
      if (!json || (!json.summary && !json.steps)) {
        throw new Error("Invalid Response Format");
      }
      setSolution(json);
    } catch (e: any) {
      console.error(e);
      let errMsg = currentLang === Language.AR || currentLang === Language.EG 
        ? "حدث خطأ. يرجى التأكد من مفتاح API أو المحاولة مرة أخرى."
        : "An error occurred. Please check your API Key or try again.";

      if (e.message?.includes('API_KEY')) {
        errMsg = "API Key is missing. Please add it in Settings/Vercel.";
      } else if (e.message?.includes('FAILED_TO_PARSE_JSON')) {
        errMsg = "AI failed to format the answer correctly. Try asking differently.";
      }
      
      setError(errMsg);
    } finally {
      setIsSolving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // Check file size (client side check, ~4MB max for safety)
      if (f.size > 4 * 1024 * 1024) {
        setError(currentLang === Language.AR ? "الصورة كبيرة جداً" : "Image too large (Max 4MB)");
        return;
      }
      
      const r = new FileReader();
      r.onload = () => {
         setImage({ data: (r.result as string).split(',')[1], mimeType: f.type });
         setError(null); // Clear errors on new upload
      };
      r.readAsDataURL(f);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter">{t('homework')}</h1>
        <p className="text-slate-500 font-medium text-lg">{t('solve')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-black text-slate-400 mb-4">{t('subjectLabel')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-2 text-start ${
                    selectedSubject === sub.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <sub.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold truncate flex-grow">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-black text-slate-400 mb-4">{t('selectTutor')}</h3>
            <div className="space-y-2">
              {tutorTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTutorType(type.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-sm ${
                    tutorType === type.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <type.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-grow">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="space-y-6">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('hwPlaceholder')}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] outline-none text-slate-900 dark:text-white font-bold text-lg min-h-[160px] resize-none"
              />
              
              {image && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-blue-500 bg-slate-900">
                  <img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-contain" alt="Attached homework" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 text-white text-xs rounded-full font-bold backdrop-blur-sm">
                    {t('imageAttached')}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/png,image/jpeg,image/webp,image/heic" 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleSolve} 
                  disabled={isSolving || (!question.trim() && !image)} 
                  className="flex-grow bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSolving ? <Loader2 className="animate-spin" /> : <Brain />} {t('hwSolve')}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-[2rem] font-bold flex items-start gap-4 animate-in fade-in zoom-in">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="uppercase text-xs font-black tracking-widest mb-1">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {solution && !error && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20">
                <h3 className="text-xs font-black uppercase mb-2 opacity-80">{t('solutionTitle')}</h3>
                <p className="text-2xl font-black">{solution.summary}</p>
              </div>
              
              {solution.steps && solution.steps.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
                  <h3 className="text-slate-400 font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Repeat className="w-4 h-4"/> {t('stepsTitle')}
                  </h3>
                  <div className="space-y-6">
                    {solution.steps.map((s: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black flex-shrink-0 group-hover:scale-110 transition-transform">{i+1}</div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-lg leading-relaxed mt-0.5">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {solution.theory && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
                  <h3 className="text-indigo-600 dark:text-indigo-400 font-black mb-2 flex items-center gap-2"><Atom className="w-4 h-4"/> {t('theoryTitle')}</h3>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{solution.theory}</p>
                </div>
              )}
              
              {solution.tip && (
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-800">
                   <h3 className="text-emerald-600 dark:text-emerald-400 font-black mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> {t('tipTitle')}</h3>
                   <p className="text-slate-700 dark:text-slate-300 font-medium">{solution.tip}</p>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
