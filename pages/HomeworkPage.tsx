
import React, { useState, useRef } from 'react';
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
  Repeat
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
  const [solveStep, setSolveStep] = useState<string | null>(null);
  const [solution, setSolution] = useState<{
    summary: string;
    steps: string[];
    theory: string;
    tip: string;
  } | null>(null);
  const [image, setImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    { id: 'math', label: t('math'), icon: 'π', color: 'bg-blue-500' },
    { id: 'physics', label: t('physics'), icon: '⚛', color: 'bg-indigo-500' },
    { id: 'chemistry', label: t('chemistry'), icon: '🧪', color: 'bg-green-500' },
    { id: 'science', label: t('science'), icon: '🧬', color: 'bg-emerald-500' },
    { id: 'history', label: t('history'), icon: '📜', color: 'bg-amber-600' },
    { id: 'arabic', label: t('arabic'), icon: 'ض', color: 'bg-red-500' },
    { id: 'english', label: t('english'), icon: 'Abc', color: 'bg-orange-500' },
  ];

  const tutors = [
    { id: 'friendly', label: t('tutorFriendly'), icon: Sparkles },
    { id: 'strict', label: t('tutorStrict'), icon: GraduationCap },
    { id: 'genius', label: t('tutorGenius'), icon: Brain },
  ];

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

  const handleSolve = async (extraPrompt: string = "") => {
    if (!question.trim() && !image) return;
    setIsSolving(true);
    setSolution(null);
    
    // Get current UI language to tell the AI to use it
    const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
    const langNames: Record<string, string> = {
      [Language.EN]: "English",
      [Language.AR]: "Standard Arabic",
      [Language.EG]: "Egyptian Arabic (Ammiya)",
      [Language.FR]: "French",
      [Language.ES]: "Spanish"
    };
    const targetLangName = langNames[currentLang] || "English";

    setSolveStep(image ? t('analyzingImage') : t('buildingLogic'));
    await new Promise(r => setTimeout(r, 1200));
    setSolveStep(t('finalizingSolution'));

    try {
      const prompt = `Solve this ${selectedSubject} question. 
      Tutor Personality: ${tutorType}. 
      Target Language: ${targetLangName}.
      ${extraPrompt ? "Special instruction: " + extraPrompt : ""}
      Question: "${question || "Look at the attached image and solve the problem inside it."}"
      
      CRITICAL: You MUST write all the CONTENT of the JSON values in ${targetLangName}. 
      If the language is Egyptian Arabic, be very friendly and use common Egyptian expressions.
      
      Respond ONLY with this JSON structure:
      {
        "summary": "Short explanation of the problem in ${targetLangName}",
        "steps": ["Step 1 in ${targetLangName}", "Step 2 in ${targetLangName}", "Final result in ${targetLangName}"],
        "theory": "The scientific rule/concept explained in ${targetLangName}",
        "tip": "A helpful advice from Eyad in ${targetLangName}"
      }`;

      const response = await generateText(prompt, { 
        systemInstruction: `You are an expert AI teacher named Eyad. You specialize in ${selectedSubject}. You always respond in valid JSON using the requested language: ${targetLangName}.`,
        image: image || undefined
      });

      // FIX: Access response.text property instead of treating response object as string
      // Attempt to extract JSON from the response text
      const startIdx = response.text.indexOf('{');
      const endIdx = response.text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = response.text.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        setSolution(parsed);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setSolution({
        summary: currentLang === Language.AR || currentLang === Language.EG ? "عذراً، حدث خطأ أثناء معالجة الحل." : "Sorry, an error occurred while processing the solution.",
        steps: [currentLang === Language.AR || currentLang === Language.EG ? "برجاء المحاولة مرة أخرى أو التأكد من وضوح السؤال." : "Please try again or ensure the question is clear."],
        theory: "",
        tip: ""
      });
    } finally {
      setIsSolving(false);
      setSolveStep(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-4 md:p-12">
      {/* Header & Intro */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Zap className="w-3.5 h-3.5 fill-blue-600" /> AI Education Hub
        </div>
        <h2 className="text-5xl md:text-6xl font-black flex items-center justify-center gap-4 dark:text-white tracking-tighter">
          {t('homework')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-xl mx-auto">
          {t('heroDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t('selectSubject')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all group ${
                    selectedSubject === s.id 
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-blue-200'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black ${selectedSubject === s.id ? 'bg-white/20' : s.color + ' text-white'}`}>
                    {s.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t('selectTutor')}</label>
            <div className="flex gap-3">
              {tutors.map(tut => (
                <button
                  key={tut.id}
                  onClick={() => setTutorType(tut.id)}
                  className={`flex-grow flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    tutorType === tut.id 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <tut.icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{tut.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('hwPlaceholder')}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl outline-none focus:ring-4 focus:ring-blue-600/10 min-h-[160px] dark:text-white font-medium resize-none transition-all"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-2xl transition-all ${image ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600'}`}
                >
                  {image ? <CheckCircle2 className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {image && (
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <ImageIcon className="w-5 h-5" /> {t('imageAttached')}
                </div>
                <button onClick={() => setImage(null)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"><X className="w-4 h-4 text-blue-600" /></button>
              </div>
            )}

            <button
              onClick={() => handleSolve()}
              disabled={isSolving || (!question.trim() && !image)}
              className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSolving ? <Loader2 className="w-7 h-7 animate-spin" /> : <Zap className="w-7 h-7 fill-white" />}
              {isSolving ? solveStep : t('hwSolve')}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-7">
          {isSolving && (
             <div className="h-full flex flex-col items-center justify-center space-y-8 animate-pulse">
                <div className="w-32 h-32 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Brain className="w-16 h-16 text-blue-600 animate-bounce" />
                </div>
                <p className="text-xl font-black text-slate-400 tracking-tighter uppercase">{solveStep}</p>
             </div>
          )}

          {!isSolving && !solution && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
              <Search className="w-24 h-24 text-slate-300" />
              <p className="text-lg font-bold text-slate-400 max-w-xs">{t('hwPlaceholder')}</p>
            </div>
          )}

          {solution && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700 pb-20">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-l-8 border-l-blue-600 border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="text-blue-600 w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600">The Eyad Approach</span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-4">{solution.summary}</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleSolve("Explain it in a much simpler way, use very basic words")}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                   >
                     <Repeat className="w-3.5 h-3.5" /> {t('explainSimpler')}
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> {t('stepByStep')}
                </h3>
                {solution.steps.map((step, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-6 group hover:border-blue-300 dark:hover:border-blue-900/50 transition-colors shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-blue-600 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed self-center">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="w-6 h-6" />
                    <span className="font-black uppercase tracking-widest text-xs">{t('theorySection')}</span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-200 font-bold leading-relaxed">{solution.theory}</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2rem] border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
                    <Lightbulb className="w-6 h-6" />
                    <span className="font-black uppercase tracking-widest text-xs">{t('proTip')}</span>
                  </div>
                  <p className="text-amber-800 dark:text-emerald-200 font-bold leading-relaxed italic">"{solution.tip}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
