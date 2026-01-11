
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
  
  // --- التحميل من الذاكرة المحلية ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-sessions-v1');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-active-id-v1');
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

  // --- حفظ البيانات تلقائياً ---
  useEffect(() => {
    localStorage.setItem('eyad-ai-sessions-v1', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem('eyad-ai-active-id-v1', activeId);
    else localStorage.removeItem('eyad-ai-active-id-v1');
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  // --- إعداد التعرف على الصوت ---
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

  // --- وظائف التحكم في الواجهة ---
  const closeSidebarIfMobile = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSend = async (forcedPrompt?: string) => {
    const pText = (forcedPrompt || input).trim();
    if (isSending.current || (!pText && !attachedImage)) return;

    closeSidebarIfMobile(); // قفل القائمة فوراً عند الإرسال
    isSending.current = true;
    setError(null);
    setIsTyping(true);
    setStreamingText('');
    setStreamingSources([]);

    const userMsg: Message = {
      id: "u_" + Date.now(),
      role: 'user',
      text: pText || "تحليل الصورة",
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
        systemInstruction: `You are Eyad AI, the original helpful assistant. 
        Always provide accurate information and match the user's dialect. 
        Use Google Search to verify facts.`
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
      setError("إياد واجه مشكلة في الشبكة. جرب تاني.");
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
    closeSidebarIfMobile(); // قفل القائمة
  };

  const selectSession = (id: string) => {
    setActiveId(id);
    closeSidebarIfMobile(); // قفل القائمة
  };

  const clearHistory = () => {
    if (window.confirm("حذف كل السجل؟")) {
      setSessions([]);
      setActiveId(null);
      localStorage.removeItem('eyad-ai-sessions-v1');
      localStorage.removeItem('eyad-ai-active-id-v1');
      closeSidebarIfMobile(); // قفل القائمة
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-slate-950">
      {/* Overlay للموبايل */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* القائمة الجانبية (Taskbar) */}
      <aside className={`fixed lg:relative z-50 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full w-72">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <button onClick={startNewChat} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
              <Plus className="w-5 h-5" /> {t('newChat')}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> {t('chatHistory')}
            </div>
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">لا يوجد محادثات</div>
            ) : (
              sessions.map(s => (
                <button 
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`w-full text-right p-3.5 rounded-xl transition-all border flex items-center justify-between group ${activeId === s.id ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 text-blue-600' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  <span className="truncate text-sm font-bold">{s.title}</span>
                  <ChevronRight className={`w-4 h-4 ${activeId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
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

      {/* منطقة الشات الرئيسية */}
      <div className="flex-grow flex flex-col relative min-w-0">
        <header className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <span className="font-black text-blue-600 tracking-tighter text-lg uppercase">Eyad AI</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Online</span>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">أهلاً بك في إياد AI</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">أنا مساعدك الذكي، اسألني عن أي شيء أو اطلب مني المساعدة في دراستك.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {["أخبار اليوم", "سعر الذهب", "حل مسألة", "اكتب مقال"].map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:border-blue-500 transition-all text-slate-700 dark:text-slate-300 shadow-sm">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Globe className="w-3 h-3" /> المصادر</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((src, i) => (
                        <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all">
                          <ExternalLink className="w-3 h-3" /> {src.title.substring(0, 15)}...
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
              <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-sm">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{streamingText}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-blue-500 font-bold">
                  <Loader2 className="w-3 h-3 animate-spin" /> جاري الكتابة...
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl w-fit shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div ref={scrollRef} className="h-2" />
        </div>

        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {attachedImage && (
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-12 h-12 rounded object-cover" alt="upload" />
                <button onClick={() => setAttachedImage(null)} className="p-1 text-red-500"><X className="w-4 h-4" /></button>
              </div>
            )}
            
            <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2">
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                  reader.readAsDataURL(file);
                }
              }} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-blue-500 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <textarea 
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="اسأل إياد..."
                className="flex-grow bg-transparent border-none outline-none py-3 px-2 text-[15px] font-medium resize-none max-h-32 dark:text-white"
              />
              
              <button onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); } }} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-blue-500'}`}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => handleSend()}
                disabled={isSending.current || (!input.trim() && !attachedImage)}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-transform active:scale-90"
              >
                {isSending.current ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
      `}</style>
    </div>
  );
};
