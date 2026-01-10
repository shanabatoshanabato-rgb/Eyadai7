
import React, { useState, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  X,
  Brain,
  GraduationCap,
  Sparkles,
  Search,
  Zap,
  Lightbulb,
  Repeat,
  PenTool,
  Atom,
  FlaskConical,
  Microscope,
  ScrollText,
  Calculator
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
  const [solution, setSolution] = useState<{
    summary: string;
    steps: string[];
    theory: string;
    tip: string;
  } | null>(null);
  const [image, setImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current language and direction
  const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
  const isRTL = currentLang === Language.AR || currentLang === Language.EG;

  // Memoize subjects to react to language changes
  const subjects = useMemo(() => [
    { id: 'math', label: t('math'), icon: Calculator, color: 'bg-blue-500' },
    { id: 'physics', label: t('physics'), icon: Atom, color: 'bg-indigo-500' },
    { id: 'chemistry', label: t('chemistry'), icon: FlaskConical, color: 'bg-green-500' },
    { id: 'science', label: t('science'), icon: Microscope, color: 'bg-emerald-500' },
    { id: 'history', label: t('history'), icon: ScrollText, color: 'bg-amber-500' },
    { id: 'literature', label: t('literature'), icon: BookOpen, color: 'bg-rose-500' },
  ], [t]);

  // Memoize tutor styles
  const tutorTypes = useMemo(() => [
    { id: 'friendly', label: t('styleFriendly'), icon: Sparkles },
    { id: 'academic', label: t('styleAcademic'), icon: GraduationCap },
    { id: 'humorous', label: t('styleHumorous'), icon: Zap },
  ], [t]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSolve = async () => {
    if (!question.trim() && !image) return;
    setIsSolving(true);
    setSolution(null);

    const prompt = `
      You are Eyad AI, a professional tutor.
      Subject: ${selectedSubject}
      Style: ${tutorType}
      Question: ${question}
      Language: ${currentLang} (IMPORTANT: Your response MUST be in this language)
      
      Solve this problem step-by-step.
      Return ONLY valid JSON in this exact format:
      {
        "summary": "Direct final answer/summary",
        "steps": ["Step 1 detailed", "Step 2 detailed"],
        "theory": "The underlying concept or formula used",
        "tip": "A helpful tip or trick to remember this"
      }
    `;

    try {
      const res = await generateText(prompt, { 
        image: image || undefined,
        systemInstruction: "You are a JSON-only response bot for homework help."
      });
      
      const text = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(text);
      setSolution(json);
    } catch (e) {
      console.error(e);
      // Fallback response if JSON fails
      setSolution({
        summary: "Error processing request / حدث خطأ",
        steps: ["Please try again / حاول مرة أخرى"],
        theory: "System Error",
        tip: "Check your connection"
      });
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div 
      className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 min-h-screen" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <GraduationCap className="w-4 h-4" /> {t('homeworkHelp')}
        </div>
        <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter">
          {t('homework')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-lg">
          {t('solve')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Options */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-1">{t('subjectLabel')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                    selectedSubject === sub.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-200'
                  }`}
                >
                  <sub.icon className={`w-6 h-6 ${selectedSubject === sub.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-1">{t('tutorLabel')}</h3>
            <div className="space-y-2">
              {tutorTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTutorType(type.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                    tutorType === type.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-200'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Input Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">{t('enterQuestion')}</label>
                <div className="relative group">
                  <HelpCircle className={`absolute top-6 w-6 h-6 text-slate-400 transition-colors group-focus-within:text-blue-500 ${isRTL ? 'left-6' : 'right-6'}`} />
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t('enterQuestion')}
                    className={`w-full py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600/20 rounded-[2rem] outline-none text-slate-900 dark:text-white font-bold text-lg shadow-inner transition-all min-h-[160px] resize-none ${isRTL ? 'pl-6 pr-6' : 'pl-6 pr-16'}`}
                  />
                </div>
              </div>

              {image && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <div className="w-12 h-12 rounded-xl bg-blue-200 dark:bg-blue-800 overflow-hidden flex-shrink-0">
                    <img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black text-blue-700 dark:text-blue-300">{t('imageAttached')}</p>
                    <button onClick={() => setImage(null)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title={t('uploadImage')}
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={handleSolve}
                  disabled={isSolving || (!question.trim() && !image)}
                  className="flex-grow bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSolving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
                  {isSolving ? t('solving') : t('solveButton')}
                </button>
              </div>
            </div>
          </div>

          {/* Solution Area */}
          {solution && (
            <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6">
              
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3 opacity-80">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-widest">{t('solutionTitle')}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black leading-tight">{solution.summary}</h2>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              </div>

              {/* Steps & Logic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Steps */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                   <h3 className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs mb-6">
                     <Repeat className="w-4 h-4" /> {t('stepsTitle')}
                   </h3>
                   <div className="space-y-6">
                     {solution.steps.map((step, idx) => (
                       <div key={idx} className="flex gap-4">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm border border-blue-200 dark:border-blue-800">
                           {idx + 1}
                         </div>
                         <p className="pt-1 text-slate-700 dark:text-slate-300 font-medium text-lg leading-relaxed">
                           {step}
                         </p>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Theory */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-900/30">
                  <h3 className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs mb-4">
                    <BookOpen className="w-4 h-4" /> {t('theoryTitle')}
                  </h3>
                  <p className="text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                    {solution.theory}
                  </p>
                </div>

                {/* Tip */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] p-8 border border-emerald-100 dark:border-emerald-900/30">
                  <h3 className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-xs mb-4">
                    <Lightbulb className="w-4 h-4" /> {t('tipTitle')}
                  </h3>
                  <p className="text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed italic">
                    "{solution.tip}"
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
