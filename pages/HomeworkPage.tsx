
// Add React to imports to fix "Cannot find namespace 'React'"
import React, { useState, useRef, useMemo } from 'react';
import { 
  BookOpen, Loader2, Image as ImageIcon, 
  Brain, GraduationCap, Sparkles, Zap, Repeat, 
  Atom, FlaskConical, Microscope, ScrollText, Calculator, Languages, X 
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
      Target Language: ${currentLang}. 
      Task: Solve the problem provided in text or image.
      CRITICAL: You MUST respond ONLY with a valid JSON object. No markdown code blocks, no intro text.
      JSON Format:
      {
        "summary": "Brief overall answer",
        "steps": ["Step 1 explanation", "Step 2 calculation", "..."],
        "theory": "The scientific/linguistic rule used",
        "tip": "A helpful advice for the student"
      }`;

      const userPrompt = question.trim() ? question : "Solve the problem in this image step by step.";
      
      const res = await generateText(userPrompt, { 
        systemInstruction,
        image: image || undefined 
      });

      const json = extractJson(res.text);
      setSolution(json);
    } catch (e: any) {
      console.error(e);
      setError(currentLang === Language.AR || currentLang === Language.EG 
        ? "حصل مشكلة في التحليل، اتأكد إن الصورة واضحة أو جرب تاني." 
        : "Analysis failed. Ensure the image is clear or try again.");
    } finally {
      setIsSolving(false);
    }
  };

  // Fixed React namespace error by adding React to imports
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = () => setImage({ data: (r.result as string).split(',')[1], mimeType: f.type });
      r.readAsDataURL(f);
    }
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
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-blue-500">
                  <img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-contain bg-black" alt="Attached homework" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleSolve} 
                  disabled={isSolving || (!question.trim() && !image)} 
                  className="flex-grow bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSolving ? <Loader2 className="animate-spin" /> : <Brain />} {t('hwSolve')}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-2xl font-bold">
              {error}
            </div>
          )}

          {solution && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-blue-600 rounded-[2rem] p-8 text-white">
                <h3 className="text-xs font-black uppercase mb-2">{t('solutionTitle')}</h3>
                <p className="text-2xl font-black">{solution.summary}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-400 font-black mb-4 flex items-center gap-2"><Repeat className="w-4 h-4"/> {t('stepsTitle')}</h3>
                <div className="space-y-4">
                  {solution.steps?.map((s: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black flex-shrink-0">{i+1}</div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              {solution.theory && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
                  <h3 className="text-indigo-600 font-black mb-2 flex items-center gap-2"><Atom className="w-4 h-4"/> {t('theoryTitle')}</h3>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{solution.theory}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
