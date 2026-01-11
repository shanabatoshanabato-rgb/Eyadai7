
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Loader2,
  Globe,
  ExternalLink,
  Plus,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  AlertCircle,
  History,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Edit2,
  Check
} from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-sessions-v4');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-active-session-v4');
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<{title: string, uri: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSending = useRef(false);

  const currentSession = useMemo(() => sessions.find(s => s.id === activeId), [sessions, activeId]);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('eyad-ai-sessions-v4', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem('eyad-ai-active-session-v4', activeId);
    else localStorage.removeItem('eyad-ai-active-session-v4');
  }, [activeId]);

  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, streamingText, isTyping]);

  const handleSend = async (forcedPrompt?: string) => {
    const pText = (forcedPrompt || input).trim();
    if (isSending.current || (!pText && !attachedImage)) return;

    isSending.current = true;
    setError(null);
    setIsTyping(true);
    setStreamingText('');
    setStreamingSources([]);

    const userMsg: Message = {
      id: "u_" + Date.now(),
      role: 'user',
      text: pText || "تحليل صورة",
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    let sId = activeId;
    if (!sId) {
      sId = "s_" + Date.now();
      const newSession: ChatSession = {
        id: sId,
        title: pText.substring(0, 30) || "محادثة جديدة",
        messages: [userMsg],
        lastTimestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveId(sId);
    } else {
      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s, 
        messages: [...s.messages, userMsg],
        lastTimestamp: Date.now()
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
        systemInstruction: "You are Eyad AI, a helpful and high-performance assistant. Use Google Search grounding for accurate facts."
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
        ...s, 
        messages: [...s.messages, modelMsg],
        lastTimestamp: Date.now()
      } : s));
      setStreamingText('');
      setStreamingSources([]);
    } catch (err: any) {
      setError("فشل الاتصال. تأكد من الإنترنت وحاول مرة أخرى.");
      setInput(backupInput);
      setAttachedImage(backupImg);
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
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("هل تريد بالتأكيد حذف هذه المحادثة؟")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeId === id) setActiveId(null);
    }
  };

  const handleRename = (e: React.MouseEvent, id: string, oldTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(oldTitle);
  };

  const saveRename = (e: React.FormEvent | React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar - Fix: Added overflow-hidden and refined transition classes */}
      <aside className={`
        fixed lg:relative z-40 h-full bg-slate-50 dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full lg:translate-x-0 opacity-0 invisible'}
      `}>
        <div className="flex flex-col h-full w-80">
          <div className="p-6">
            <button 
              onClick={startNewChat}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> محادثة جديدة
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto px-4 space-y-2 custom-scrollbar">
            <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> السجلات القديمة
            </div>
            
            {sessions.length === 0 ? (
              <div className="p-10 text-center space-y-4 opacity-30">
                <MessageSquare className="w-12 h-12 mx-auto" />
                <p className="text-xs font-bold">ابدأ أول محادثة الآن</p>
              </div>
            ) : (
              sessions.sort((a,b) => b.lastTimestamp - a.lastTimestamp).map(session => (
                <div 
                  key={session.id}
                  onClick={() => {
                    setActiveId(session.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`group relative w-full p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all border-2 ${
                    activeId === session.id 
                    ? 'bg-white dark:bg-slate-800 border-blue-600/20 shadow-md ring-1 ring-blue-600/10' 
                    : 'border-transparent hover:bg-white dark:hover:bg-slate-800/40 text-slate-500'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${activeId === session.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveRename(e as any, session.id)}
                          className="w-full bg-white dark:bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-xs outline-none"
                        />
                        <button onClick={e => saveRename(e, session.id)} className="text-green-500"><Check className="w-3.5 h-3.5"/></button>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm font-black truncate ${activeId === session.id ? 'text-slate-900 dark:text-white' : ''}`}>
                          {session.title}
                        </p>
                        <p className="text-[10px] opacity-60 font-bold">{new Date(session.lastTimestamp).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleRename(e, session.id, session.title)} className="p-1.5 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => deleteSession(e, session.id)} className="p-1.5 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg">E</div>
               <div><p className="text-xs font-black dark:text-white">إياد العبقري</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Pro Plus Edition</p></div>
             </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col relative min-w-0">
        <header className="h-20 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center"
              title={isSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[150px] md:max-w-xs">
                {currentSession ? currentSession.title : "دردشة إياد المفتوحة"}
              </span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">محمي بـ Gemini 3.0</span>
              </div>
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in duration-1000">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center border-2 border-blue-600/5 rotate-3 hover:rotate-0 transition-transform">
                <Sparkles className="w-12 h-12 text-blue-600" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">أهلاً بك يا بطل! <br/> <span className="text-blue-600">أنا إياد، جاهز لكل أسئلتك.</span></h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">ابدأ اسألني في أي شيء، أو ارفع صورة لنقوم بحلها معاً باستخدام أحدث تقنيات البحث في جوجل.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {["ما هي أخبار التكنولوجيا اليوم؟", "اشرح لي قاعدة النحو ببساطة", "اكتب لي كود بايثون سريع", "كيف أذاكر بذكاء؟"].map(q => (
                  <button key={q} onClick={() => handleSend(q)} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-start hover:border-blue-500 hover:shadow-xl transition-all flex items-center gap-4 group">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Sparkles className="w-4 h-4" /></div>
                    <span className="dark:text-slate-200">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
              <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.image && <img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="w-48 h-48 rounded-[2rem] object-cover shadow-xl border-4 border-white dark:border-slate-900 mb-2" alt="upload" />}
                <div className={`p-6 rounded-[2.5rem] shadow-sm relative group ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-600" /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">المصادر الموثقة</p></div>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((src, i) => (
                          <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-600/10"><ExternalLink className="w-3 h-3" /> {src.title.substring(0, 25)}...</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-black uppercase text-slate-400 px-4 opacity-50">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="flex justify-start animate-in fade-in">
              <div className="max-w-[85%] p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{streamingText}</p>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-blue-500 font-black uppercase tracking-widest"><Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري سحب المعلومات من جوجل...</div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl w-fit shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          
          {error && (
            <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900 rounded-[2.5rem] text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-4 animate-in shake">
              <AlertCircle className="w-6 h-6 flex-shrink-0" /><div className="flex-grow"><p>{error}</p><button onClick={() => handleSend()} className="mt-2 text-[10px] font-black uppercase underline">إعادة المحاولة</button></div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input Controls */}
        <div className="p-6 md:p-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            {attachedImage && (
              <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-3xl w-fit border border-blue-600/10 animate-in slide-in-from-bottom-2">
                <div className="relative">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-20 h-20 rounded-2xl object-cover shadow-xl" alt="upload" />
                  <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X className="w-4 h-4" /></button>
                </div>
                <div className="pr-4"><p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">الصورة جاهزة</p><p className="text-xs font-bold dark:text-slate-300">إياد سيحللها الآن</p></div>
              </div>
            )}
            <div className="flex items-end gap-3 bg-slate-100 dark:bg-slate-900 rounded-[3rem] p-3 shadow-inner border border-transparent focus-within:border-blue-500/50 transition-all">
              <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type }); reader.readAsDataURL(file); } }} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-500 hover:text-blue-500 rounded-full transition-all"><ImageIcon className="w-6 h-6" /></button>
              <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="اسأل إياد عن أي شيء..." className="flex-grow bg-transparent border-none outline-none py-4 px-2 text-[15px] font-medium resize-none max-h-40 custom-scrollbar dark:text-white" />
              <button onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); } }} className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>{isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
              <button onClick={() => handleSend()} disabled={isSending.current || (!input.trim() && !attachedImage)} className="p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] shadow-2xl disabled:opacity-50 transition-all active:scale-95">{isSending.current ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
