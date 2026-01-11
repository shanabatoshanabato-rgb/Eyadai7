
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Loader2,
  Globe,
  ExternalLink,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-v1-sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-v1-active-id');
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<{title: string, uri: string}[]>([]);
  const [error, setError] = useState<{msg: string, code: string} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSending = useRef(false);

  const currentSession = sessions.find(s => s.id === activeId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('eyad-ai-v1-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem('eyad-ai-v1-active-id', activeId);
    else localStorage.removeItem('eyad-ai-v1-active-id');
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSend = async (forcedPrompt?: string) => {
    const pText = (forcedPrompt || input).trim();
    if (isSending.current || (!pText && !attachedImage)) return;

    closeSidebarOnMobile();
    isSending.current = true;
    setError(null);
    setIsTyping(true);
    setStreamingText('');
    setStreamingSources([]);

    const userMsg: Message = {
      id: "u_" + Date.now(),
      role: 'user',
      text: pText || "تحليل صورة",
      timestamp: Date.now()
    };

    let sId = activeId;
    if (!sId) {
      sId = "s_" + Date.now();
      const newS: ChatSession = {
        id: sId,
        title: pText.substring(0, 30) || "محادثة جديدة",
        messages: [userMsg],
        lastTimestamp: Date.now()
      };
      setSessions(prev => [newS, ...prev]);
      setActiveId(sId);
    } else {
      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s, messages: [...s.messages, userMsg], lastTimestamp: Date.now()
      } : s));
    }

    const backupInput = pText;
    const backupImg = attachedImage;
    setInput('');
    setAttachedImage(null);

    try {
      const stream = generateTextStream(pText, {
        useSearch: true,
        image: backupImg || undefined,
        systemInstruction: "You are Eyad AI, a professional engineer. Answer accurately and verify with search."
      });

      let fullText = "";
      let sources: any[] = [];

      for await (const chunk of stream) {
        setIsTyping(false);
        fullText = chunk.fullText;
        sources = chunk.sources;
        setStreamingText(fullText);
        setStreamingSources(sources);
      }

      const modelMsg: Message = {
        id: "m_" + Date.now(),
        role: 'model',
        text: fullText,
        timestamp: Date.now(),
        sources: sources
      };

      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s, messages: [...s.messages, modelMsg], lastTimestamp: Date.now()
      } : s));
      setStreamingText('');
      setStreamingSources([]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      let msg = "حصلت مشكلة في الاتصال بالسيرفر. جرب تاني كمان شوية.";
      let code = "NETWORK_ERROR";

      if (err.message === "API_KEY_MISSING" || err.message === "INVALID_API_KEY") {
        msg = "الـ API KEY مش شغال أو مش موجود في Vercel. لازم تعيد رفع المشروع (Redeploy).";
        code = "KEY_ERROR";
      } else if (err.message === "QUOTA_EXCEEDED") {
        msg = "خلصت رصيد الاستخدام المجاني النهاردة. استنى شوية وجرب تاني.";
        code = "QUOTA_ERROR";
      }

      setError({ msg, code });
      setInput(backupInput);
    } finally {
      setIsTyping(false);
      isSending.current = false;
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setInput('');
    setAttachedImage(null);
    setError(null);
    closeSidebarOnMobile();
  };

  const clearHistory = () => {
    if (window.confirm("حذف كل السجل وتصفير البرنامج؟")) {
      setSessions([]);
      setActiveId(null);
      localStorage.removeItem('eyad-ai-v1-sessions');
      localStorage.removeItem('eyad-ai-v1-active-id');
      setStreamingText('');
      setError(null);
      closeSidebarOnMobile();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-slate-950">
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:relative z-50 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden invisible lg:visible'}`}>
        <div className="flex flex-col h-full w-72">
          <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <button onClick={startNewChat} className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
              <Plus className="w-5 h-5" /> {t('newChat')}
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 ml-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> {t('chatHistory')}
            </div>
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">لا يوجد محادثات قديمة</div>
            ) : (
              sessions.map(s => (
                <button key={s.id} onClick={() => { setActiveId(s.id); closeSidebarOnMobile(); }} className={`w-full text-right p-3.5 rounded-xl transition-all border flex items-center justify-between group ${activeId === s.id ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 text-blue-600' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <span className="truncate text-sm font-bold flex-grow">{s.title}</span>
                  <ChevronRight className={`w-4 h-4 transition-all ${activeId === s.id ? 'opacity-100 rotate-90 text-blue-500' : 'opacity-0 group-hover:opacity-50'}`} />
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button onClick={clearHistory} className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
              <Trash2 className="w-4 h-4" /> {t('clearHistory')}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-grow flex flex-col relative min-w-0">
        <header className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <span className="font-black text-blue-600 text-lg uppercase tracking-tighter">Eyad AI</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active System</span>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">أهلاً يا هندسة!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">أنا إياد، مساعدك الشخصي المتصل بالإنترنت. اسألني عن أي حاجة أو ارفع صورة.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {["أخبار التكنولوجيا", "سعر الذهب الآن", "حل مسألة رياضية", "اكتب لي كود"].map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold hover:border-blue-500 hover:shadow-xl transition-all text-slate-700 dark:text-slate-300 shadow-sm active:scale-95">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap text-base leading-relaxed font-medium">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> المصادر الحقيقية</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((src, i) => (
                        <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200">
                          <ExternalLink className="w-3 h-3" /> {src.title.substring(0, 20)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="flex justify-start animate-in fade-in">
              <div className="max-w-[85%] p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm">
                <p className="whitespace-pre-wrap text-base leading-relaxed font-medium">{streamingText}</p>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-blue-500 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري البحث في جوجل...
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl w-fit shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 animate-in shake">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-black text-sm">{error.msg}</p>
                  <p className="text-[10px] font-bold opacity-50">Error Code: {error.code}</p>
                  <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> إعادة تحميل الصفحة
                  </button>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        <div className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {attachedImage && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl w-fit border border-blue-100 dark:border-blue-900/50">
                <div className="relative">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-16 h-16 rounded-lg object-cover shadow-md" alt="upload" />
                  <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-[10px] font-black uppercase text-blue-600 px-2">تم رفع الصورة</p>
              </div>
            )}
            
            <div className="flex items-end gap-3 bg-slate-100 dark:bg-slate-900 rounded-3xl p-3 border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                  reader.readAsDataURL(file);
                }
              }} className="hidden" accept="image/*" />
              
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all">
                <ImageIcon className="w-6 h-6" />
              </button>
              
              <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="اسأل إياد عن أي حاجة..." className="flex-grow bg-transparent border-none outline-none py-3 px-2 text-base font-medium resize-none max-h-40 custom-scrollbar dark:text-white" />
              
              <button onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); } }} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`}>
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button onClick={() => handleSend()} disabled={isSending.current || (!input.trim() && !attachedImage)} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-600/30 disabled:opacity-50 transition-all active:scale-90 flex-shrink-0">
                {isSending.current ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
