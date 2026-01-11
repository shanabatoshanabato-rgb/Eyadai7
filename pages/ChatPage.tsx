
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
  ChevronRight
} from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  
  // --- State Management ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-v5-sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-v5-active-id');
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<{title: string, uri: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSending = useRef(false);

  const currentSession = sessions.find(s => s.id === activeId);
  const messages = currentSession?.messages || [];

  // --- Persistence Hooks ---
  useEffect(() => {
    localStorage.setItem('eyad-ai-v5-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem('eyad-ai-v5-active-id', activeId);
    } else {
      localStorage.removeItem('eyad-ai-v5-active-id');
    }
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  // Voice Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'ar-SA';
      rec.onresult = (e: any) => setInput(prev => prev + ' ' + e.results[0][0].transcript);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  // --- Core UI Logic ---
  const closeSidebarOnAction = () => {
    // يقفل القائمة فقط لو إحنا في وضع الموبايل أو الشاشات الصغيرة
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSend = async (forcedPrompt?: string) => {
    const pText = (forcedPrompt || input).trim();
    if (isSending.current || (!pText && !attachedImage)) return;

    // قفل القائمة الجانبية فوراً عند بدء الإرسال في الموبايل
    closeSidebarOnAction();
    
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
      const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const stream = generateTextStream(pText, {
        useSearch: true,
        image: backupImg || undefined,
        systemInstruction: `You are Eyad AI, a 2026 engineer.
        DATE: ${today}.
        SEARCH: Mandatory Google Search for factual accuracy.
        LANGUAGE: Match user's dialect exactly (Egyptian, Gulf, English, etc.).
        STYLE: Direct, fast, zero fluff.`
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
    } catch (err) {
      setError("إياد واجه مشكلة في الاتصال بالشبكة. جرب تاني.");
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
    setStreamingText('');
    setStreamingSources([]);
    setError(null);
    closeSidebarOnAction(); // التأكد من قفل القائمة
  };

  const clearEverything = () => {
    if (window.confirm("حذف كل السجل والمحادثات نهائياً؟")) {
      // 1. تصفير الـ State فوراً
      setSessions([]);
      setActiveId(null);
      setStreamingText('');
      setStreamingSources([]);
      
      // 2. مسح الـ LocalStorage
      localStorage.removeItem('eyad-ai-v5-sessions');
      localStorage.removeItem('eyad-ai-v5-active-id');
      
      // 3. قفل القائمة الجانبية
      closeSidebarOnAction();
    }
  };

  const selectSession = (id: string) => {
    setActiveId(id);
    closeSidebarOnAction(); // قفل القائمة بعد اختيار شات قديم
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Mobile Overlay (Darkens background when sidebar is open) */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Taskbar */}
      <aside className={`fixed lg:relative z-[70] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden invisible lg:visible'}`}>
        <div className="flex flex-col h-full w-80">
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <button onClick={startNewChat} className="flex-grow py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter">
              <Plus className="w-5 h-5" /> {t('newChat')}
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-3 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-4 py-3 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <History className="w-3.5 h-3.5" /> {t('chatHistory')}
            </div>
            {sessions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold italic opacity-40">السجل فارغ تماماً</div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="group relative">
                  <button 
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-right p-4 rounded-xl transition-all border flex items-center justify-between ${activeId === s.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-600 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="truncate text-sm font-bold flex-grow">{s.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeId === s.id ? 'rotate-90 text-blue-500' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if(activeId === s.id) setActiveId(null); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={clearEverything} className="w-full py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100">
              <Trash2 className="w-4 h-4" /> {t('clearHistory')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Engine */}
      <div className="flex-grow flex flex-col relative w-full overflow-hidden">
        {/* Navbar */}
        <header className="h-16 px-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">EYAD 2026</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <Globe className="w-4 h-4 text-blue-500" /> Active Grounding
          </div>
        </header>

        {/* Message Flow */}
        <div className="flex-grow overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
          {(messages.length === 0 && !streamingText) ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10 animate-pulse" />
                <div className="relative w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
                  <Sparkles className="w-12 h-12 text-white fill-white/20" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Eyad AI 2026</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed px-6">أهلاً بك. أنا محرك بحث ذكي متصل بالإنترنت لحظياً. كيف أساعدك اليوم؟</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full px-4">
                {["أخبار التكنولوجيا الآن", "سعر الذهب اليوم", "أهم تريندات ٢٠٢٦", "حل مسألة صعبة"].map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold hover:border-blue-500 hover:shadow-xl transition-all text-slate-700 dark:text-slate-300 active:scale-95">{q}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-3`}>
                  <div className={`max-w-[90%] md:max-w-[80%] p-6 rounded-[2.5rem] shadow-sm relative ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed font-medium text-base md:text-lg tracking-tight">{m.text}</p>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Globe className="w-4 h-4 text-blue-500" /> المصادر الحية</p>
                        <div className="flex flex-wrap gap-2">
                          {m.sources.map((src, i) => (
                            <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200">
                              <ExternalLink className="w-3.5 h-3.5" /> {src.title.substring(0, 25)}...
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-2.5 uppercase tracking-widest opacity-60 px-4">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}

              {streamingText && (
                <div className="flex flex-col items-start animate-in fade-in">
                  <div className="max-w-[90%] md:max-w-[80%] p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed font-medium text-base md:text-lg">{streamingText}</p>
                  </div>
                  <span className="text-[9px] font-black text-blue-600 mt-2.5 uppercase tracking-widest flex items-center gap-2 px-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> إياد يحلل الإنترنت الآن...
                  </span>
                </div>
              )}

              {isTyping && (
                <div className="flex items-center gap-3.5 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-fit shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Live Search Active...</span>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input area */}
        <div className="p-4 md:p-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="max-w-4xl mx-auto space-y-5">
            {attachedImage && (
              <div className="flex items-center gap-4 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 w-fit animate-in slide-in-from-bottom-5">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl border-2 border-white dark:border-slate-700">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-full h-full object-cover" alt="upload" />
                  <button onClick={() => setAttachedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="pr-3"><p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Image Loaded</p></div>
              </div>
            )}
            
            <div className="flex gap-3 items-end">
              <div className="flex-grow flex items-end bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-2.5 border-2 border-transparent focus-within:border-blue-500/20 transition-all">
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all flex-shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </button>
                <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="اسأل إياد عن أي شيء في ٢٠٢٦..."
                  className="flex-grow bg-transparent border-none outline-none py-4 px-4 text-slate-900 dark:text-white font-medium text-lg resize-none max-h-48 custom-scrollbar"
                />
                <button onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); } }} className={`p-4 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`}>
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
              <button 
                onClick={() => handleSend()}
                disabled={isSending.current || (!input.trim() && !attachedImage)}
                className="p-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all active:scale-90 flex-shrink-0"
              >
                {isSending.current ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
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
        @keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
