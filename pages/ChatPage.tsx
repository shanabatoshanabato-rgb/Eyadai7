
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
import { Message, ChatSession, Language } from '../types';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-v4-sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-v4-active-id');
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<{title: string, uri: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSending = useRef(false);

  // --- Helpers ---
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const messages = currentSession?.messages || [];

  // Sync to Storage
  useEffect(() => {
    localStorage.setItem('eyad-ai-v4-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) localStorage.setItem('eyad-ai-v4-active-id', activeSessionId);
    else localStorage.removeItem('eyad-ai-v4-active-id');
  }, [activeSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  // Mic Logic
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

  // --- Actions ---
  const handleSend = async (forcedPrompt?: string) => {
    const promptText = (forcedPrompt || input).trim();
    if (isSending.current || (!promptText && !attachedImage)) return;

    isSending.current = true;
    setError(null);
    setIsTyping(true);
    setStreamingText('');
    setStreamingSources([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on send if mobile

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: promptText || "تحليل الصورة",
      timestamp: Date.now()
    };

    let sId = activeSessionId;
    if (!sId) {
      sId = "s_" + Date.now();
      const newSession: ChatSession = {
        id: sId,
        title: promptText.substring(0, 30) || "محادثة سريعة",
        messages: [userMsg],
        lastTimestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(sId);
    } else {
      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s, messages: [...s.messages, userMsg], lastTimestamp: Date.now()
      } : s));
    }

    const backupInput = promptText;
    const backupImg = attachedImage;
    setInput('');
    setAttachedImage(null);

    try {
      const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const stream = generateTextStream(promptText, {
        useSearch: true,
        image: backupImg || undefined,
        systemInstruction: `You are Eyad AI, a real-time engineer for the year 2026.
        MANDATORY: Always use Google Search for every query to be 100% accurate for 2026 events.
        BEHAVIOR: Respond INSTANTLY. Match the user's dialect (Egyptian, Gulf, English, etc.) perfectly. 
        STYLE: No long intros. Just the facts. High-speed response is priority.`
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
      setError("إياد واجه مشكلة بسيطة في الشبكة. جرب تاني.");
      setInput(backupInput);
    } finally {
      setIsTyping(false);
      isSending.current = false;
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setInput('');
    setAttachedImage(null);
    setError(null);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar after clicking new chat on mobile
  };

  const clearAllHistory = () => {
    if (window.confirm("حذف السجل بالكامل؟ مش هتعرف ترجعهم تاني.")) {
      setSessions([]);
      setActiveSessionId(null);
      localStorage.removeItem('eyad-ai-v4-sessions');
      localStorage.removeItem('eyad-ai-v4-active-id');
      setStreamingText('');
      setStreamingSources([]);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // Auto-close sidebar on mobile
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Taskbar */}
      <aside className={`fixed lg:relative z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full w-80">
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <button onClick={startNewChat} className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> {t('newChat')}
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-3 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-4 py-3 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <History className="w-3.5 h-3.5" /> {t('chatHistory')}
            </div>
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium italic">سجلك فاضي يا بطل</div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="group relative">
                  <button 
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-right p-4 rounded-xl transition-all border flex items-center justify-between ${activeSessionId === s.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="truncate text-sm font-bold flex-grow">{s.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeSessionId === s.id ? 'rotate-90 text-blue-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if(activeSessionId === s.id) setActiveSessionId(null); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={clearAllHistory} className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100">
              <Trash2 className="w-4 h-4" /> {t('clearHistory')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col relative w-full">
        {/* Header */}
        <header className="h-16 px-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">EYAD ENGINE 2026</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <Globe className="w-4 h-4 text-blue-500" /> Active Search (2026)
          </div>
        </header>

        {/* Message Flow */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-10 animate-pulse" />
                <div className="relative w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                  <Sparkles className="w-10 h-10 text-white fill-white/20" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">إياد ٢٠٢٦ جاهز!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed px-4">موصول بالإنترنت لحظة بلحظة. اسأل عن أي حاجة وهجيب لك الإجابة بالدليل.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full px-4">
                {["أخبار التكنولوجيا اليوم", "سعر الذهب الآن", "أهم تريندات ٢٠٢٦", "حل مسألة معقدة"].map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] font-bold hover:border-blue-500 hover:shadow-md transition-all text-slate-700 dark:text-slate-300">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[90%] md:max-w-[80%] p-5 rounded-[2rem] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap leading-relaxed font-medium text-[15px] md:text-base tracking-tight">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> مراجع البحث</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((src, i) => (
                        <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200">
                          <ExternalLink className="w-3 h-3" /> {src.title.substring(0, 20)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest opacity-60 px-2">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}

          {streamingText && (
            <div className="flex flex-col items-start animate-in fade-in">
              <div className="max-w-[90%] md:max-w-[80%] p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm">
                <p className="whitespace-pre-wrap leading-relaxed font-medium text-[15px] md:text-base">{streamingText}</p>
              </div>
              <span className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-widest flex items-center gap-1.5 px-2">
                <Loader2 className="w-3 h-3 animate-spin" /> إياد يحلل الويب الآن...
              </span>
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Browsing 2026 Web...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-2xl text-red-600 flex items-center gap-3 animate-in shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Bottom Input */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto space-y-4">
            {attachedImage && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 w-fit animate-in slide-in-from-bottom-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-700">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-full h-full object-cover" alt="preview" />
                  <button onClick={() => setAttachedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="pr-2"><p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Attachment Ready</p></div>
              </div>
            )}
            
            <div className="flex gap-2 md:gap-3 items-end">
              <div className="flex-grow flex items-end bg-slate-100 dark:bg-slate-900 rounded-[2rem] p-2 border-2 border-transparent focus-within:border-blue-500/20 transition-all">
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
                  className="flex-grow bg-transparent border-none outline-none py-4 px-3 text-slate-900 dark:text-white font-medium text-[16px] md:text-lg resize-none max-h-40"
                />
                <button onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); } }} className={`p-4 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'text-slate-500 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`}>
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
              <button 
                onClick={() => handleSend()}
                disabled={isSending.current || (!input.trim() && !attachedImage)}
                className="p-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full shadow-2xl shadow-blue-600/30 transition-all active:scale-90 flex-shrink-0"
              >
                {isSending.current ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};
