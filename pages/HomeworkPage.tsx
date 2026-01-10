
import React, { useState, useRef, useMemo } from 'react';
import { 
  BookOpen, HelpCircle, Loader2, CheckCircle2, Image as ImageIcon, 
  Brain, GraduationCap, Sparkles, Zap, Lightbulb, Repeat, 
  Atom, FlaskConical, Microscope, ScrollText, Calculator, Languages 
} from 'lucide-react';
import { generateText } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const HomeworkPage: React.FC = () => {
  const t = useTranslation();
  const [question, setQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [tutorType, setTutorType] = useState('friendly');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
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
    try {
      const prompt = `Solve as Eyad AI. Subject: ${selectedSubject}. Answer in ${currentLang}. Output JSON: {"summary":"","steps":[],"theory":"","tip":""}`;
      const res = await generateText(prompt + "\nQuestion: " + question, { image: image || undefined });
      const json = JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim());
      setSolution(json);
    } catch (e) {
      setSolution({ summary: "Error occurred.", steps: ["Try again."], theory: "", tip: "" });
    } finally {
      setIsSolving(false);
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
              <div className="flex gap-4">
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const r = new FileReader();
                    r.onload = () => setImage({ data: (r.result as string).split(',')[1], mimeType: f.type });
                    r.readAsDataURL(f);
                  }
                }} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <button onClick={handleSolve} disabled={isSolving} className="flex-grow bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50">
                  {isSolving ? <Loader2 className="animate-spin" /> : <Brain />} {t('hwSolve')}
                </button>
              </div>
            </div>
          </div>

          {solution && (
            <div className="space-y-6">
              <div className="bg-blue-600 rounded-[2rem] p-8 text-white">
                <h3 className="text-xs font-black uppercase mb-2">{t('solutionTitle')}</h3>
                <p className="text-2xl font-black">{solution.summary}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-400 font-black mb-4 flex items-center gap-2"><Repeat className="w-4 h-4"/> {t('stepsTitle')}</h3>
                <div className="space-y-4">
                  {solution.steps.map((s: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">{i+1}</div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
