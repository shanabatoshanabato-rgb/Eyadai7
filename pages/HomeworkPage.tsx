
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
  const isRTL = currentLang === Language.AR || currentLang === Language.DIALECT;

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
      const systemInstruction = `You are Eyad AI, a world-class academic tutor. Output ONLY a valid JSON object.
      Required JSON Schema: { "summary": "...", "steps": ["...", "..."], "theory": "...", "tip": "..." }
      Language: ${currentLang}.`;

      const res = await generateText(question.trim() || "Analyze homework", { 
        systemInstruction,
        image: image || undefined,
        responseMimeType: "application/json"
      });

      const json = extractJson(res.text) as SolutionData;
      if (!json.summary || !Array.isArray(json.steps)) throw new Error("FORMAT_ERROR");
      setSolution(json);
    } catch (e: any) {
      setError("Connection error or format error. Please try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-blue-600/10 rounded-3xl border border-blue-600/20"><BookOpen className="w-12 h-12 text-blue-600" /></div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{t('homework')}</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">{t('solve')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">{t('subjectLabel')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <button key={sub.id} onClick={() => setSelectedSubject(sub.id)} className={`flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all group ${selectedSubject === sub.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-lg' : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-slate-200'}`}><sub.icon className="w-6 h-6" /><span className="text-xs font-black">{sub.label}</span></button>
                ))}
              </div>
            </section>
            <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('selectTutor')}</h3>
              <div className="space-y-2">
                {tutorTypes.map((type) => (
                  <button key={type.id} onClick={() => setTutorType(type.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${tutorType === type.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:border-indigo-100'}`}><div className={`p-2 rounded-xl ${tutorType === type.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800'}`}><type.icon className="w-5 h-5" /></div><span className="flex-grow text-left rtl:text-right">{type.label}</span></button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('hwPlaceholder')} className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] outline-none text-slate-900 dark:text-white font-bold text-xl min-h-[220px] resize-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner" />
            {image && <div className="relative group rounded-[2rem] overflow-hidden border-4 border-blue-600/20 bg-slate-100 dark:bg-slate-800 aspect-[16/9]"><img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-contain" /><button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-2xl"><X className="w-6 h-6" /></button></div>}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all border border-slate-200 shadow-md active:scale-95"><ImageIcon className="w-6 h-6" />Attach Photo</button>
              <button onClick={handleSolve} disabled={isSolving || (!question.trim() && !image)} className="flex-grow px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 shadow-xl shadow-blue-600/40 hover:bg-blue-700 transition-all disabled:opacity-50">{isSolving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8 fill-white" />}{isSolving ? t('processing') : t('hwSolve')}</button>
            </div>
          </div>
          {error && <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 rounded-[2.5rem] text-red-700 flex items-start gap-4 animate-in slide-in-from-top-4"><AlertCircle className="w-7 h-7 flex-shrink-0 mt-0.5" /><div><p className="uppercase text-[10px] font-black tracking-widest opacity-60">System Notice</p><p className="text-lg leading-relaxed">{error}</p></div></div>}
          {solution && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 text-white shadow-2xl space-y-4"><div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-blue-200" /><h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{t('solutionTitle')}</h3></div><p className="text-3xl md:text-4xl font-black leading-tight tracking-tight">{solution.summary}</p></div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-10"><h3 className="text-slate-400 font-black flex items-center gap-3 uppercase tracking-widest text-[10px]"><Repeat className="w-5 h-5 text-blue-600" /> {t('stepsTitle')}</h3><div className="grid grid-cols-1 gap-10">{solution.steps.map((step, i) => (<div key={i} className="flex gap-8 items-start group"><div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 flex items-center justify-center text-xl font-black flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">{i + 1}</div><div className="space-y-2 pt-1"><p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">{step}</p><div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:w-full group-hover:bg-blue-600/30 transition-all duration-1000"></div></div></div>))}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-indigo-50 dark:bg-indigo-950/30 p-10 rounded-[3rem] border border-indigo-100 space-y-5"><div className="flex items-center gap-3 text-indigo-600"><Atom className="w-7 h-7" /><h3 className="font-black uppercase tracking-widest text-[10px]">{t('theoryTitle')}</h3></div><p className="text-slate-700 dark:text-slate-300 font-bold text-lg leading-relaxed">{solution.theory}</p></div><div className="bg-emerald-50 dark:bg-emerald-950/30 p-10 rounded-[3rem] border border-emerald-100 space-y-5"><div className="flex items-center gap-3 text-emerald-600"><Lightbulb className="w-7 h-7" /><h3 className="font-black uppercase tracking-widest text-[10px]">{t('tipTitle')}</h3></div><p className="text-slate-700 dark:text-slate-300 font-bold text-lg leading-relaxed italic">{solution.tip}</p></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
