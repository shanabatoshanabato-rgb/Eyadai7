
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Loader2,
  Plus,
  Image as ImageIcon,
  History,
  MessageSquare,
  Edit2,
  X as CloseIcon,
  Trash,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-sessions-v5');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-active-session-v5');
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSending = useRef(false);

  const currentSession = useMemo(() => sessions.find(s => s.id === activeId), [sessions, activeId]);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('eyad-ai-sessions-v5', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem('eyad-ai-active-session-v5', activeId);
    else localStorage.removeItem('eyad-ai-active-session-v5');
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingText, isTyping, error]);

  const handleSend = async (forcedPrompt?: string) => {
    const pText = (forcedPrompt || input).trim();
    if (isSending.current || (!pText && !attachedImage)) return;

    isSending.current = true;
    setIsTyping(true);
    setError(null);
    setStreamingText('');

    const userMsg: Message = {
      id: "u_" + Date.now() + Math.random(),
      role: 'user',
      text: pText || (t('attachPhoto')),
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    let sId = activeId;
    if (!sId) {
      sId = "s_" + Date.now();
      const newSession: ChatSession = {
        id: sId,
        title: pText.substring(0, 20) || t('newChat'),
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

    const backupImg = attachedImage;
    setInput('');
    setAttachedImage(null);

    try {
      const stream = generateTextStream(pText, {
        useSearch: false, 
        image: backupImg || undefined,
        systemInstruction: "You are Eyad AI, a brilliant and helpful educational partner. Answer concisely and creatively."
      });

      let fullText = "";
      for await (const chunk of stream) {
        setIsTyping(false);
        fullText = chunk.fullText;
        setStreamingText(fullText);
      }

      const modelMsg: Message = {
        id: "m_" + Date.now() + Math.random(),
        role: 'model',
        text: fullText,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s, 
        messages: [...s.messages, modelMsg],
        lastTimestamp: Date.now()
      } : s));
      setStreamingText('');
    } catch (err: any) {
      setError("Connection error.");
    } finally {
      setIsTyping(false);
      isSending.current = false;
    }
  };

  const deleteMessage = (msgId: string) => {
    if (!activeId) return;
    setSessions(prev => prev.map(s => s.id === activeId ? {
      ...s,
      messages: s.messages.filter(m => m.id !== msgId)
    } : s));
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveTitle = (id: string) => {
    if (editingTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s));
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
      
      {/* Sidebar with Toggle logic */}
      <div 
        className={`bg-slate-50 dark:bg-[#020617] border-e border-slate-200 dark:border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out hidden md:flex shadow-sm ${
          isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 whitespace-nowrap">
          <span className="font-black text-xs flex items-center gap-2 text-slate-400 uppercase tracking-widest">
            <History size={14}/> {t('chatHistory')}
          </span>
        </div>
        
        <div className="p-4 whitespace-nowrap">
          <button 
            onClick={() => setActiveId(null)}
            className="w-full py-3.5 bg-blue-600 text-white border border-blue-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
          >
            <Plus size={18}/> {t('newChat')}
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1 whitespace-nowrap">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setActiveId(s.id)}
              className={`group px-4 py-3.5 rounded-2xl cursor-pointer flex items-center gap-3 transition-all border ${
                activeId === s.id 
                  ? 'bg-blue-600/10 border-blue-600/20 text-blue-600' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare size={16} className="shrink-0"/>
              {editingId === s.id ? (
                <input
                  autoFocus
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-2 py-1 rounded-lg w-full outline-none border border-blue-500"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') saveTitle(s.id); if(e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-sm font-bold truncate flex-grow tracking-tight leading-tight">{s.title}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={(e) => { e.stopPropagation(); startEditing(s.id, s.title); }} className="p-1.5 hover:text-blue-600"><Edit2 size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if(activeId === s.id) setActiveId(null); }} className="p-1.5 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col min-w-0 bg-white dark:bg-[#020617] relative transition-all duration-300">
        <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all hidden md:flex items-center justify-center"
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <h2 className="text-sm font-black tracking-tight truncate max-w-[250px] md:max-w-[400px]">
              {currentSession ? currentSession.title : t('newChat')}
            </h2>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto px-4 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 && !streamingText && (
              <div className="py-24 text-center space-y-8 animate-in fade-in duration-1000">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto border border-blue-600/20">
                  <Sparkles size={40} className="text-blue-600 animate-pulse"/>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter">{t('welcomeTitle')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                    {t('welcomeDesc')}
                  </p>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`max-w-[85%] relative ${m.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} p-5 rounded-[2rem] shadow-sm`}>
                  
                  <button 
                    onClick={() => deleteMessage(m.id)}
                    className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl z-10 hover:scale-110 active:scale-90"
                    title={t('delete')}
                  >
                    <Trash size={12}/>
                  </button>

                  {m.image && <img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="max-w-full rounded-2xl mb-4 border border-white/10" alt="sent"/>}
                  <p className="whitespace-pre-wrap font-bold text-sm md:text-base leading-relaxed tracking-tight">{m.text}</p>
                  
                  <div className={`text-[9px] mt-3 opacity-40 uppercase tracking-[0.2em] font-black ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.role === 'user' ? t('user') : t('ai')}
                  </div>
                </div>
              </div>
            ))}

            {(streamingText || isTyping) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[2rem]">
                  {isTyping && !streamingText ? (
                    <div className="flex gap-1.5 p-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-bold text-sm md:text-base leading-relaxed tracking-tight">{streamingText}</p>
                  )}
                </div>
              </div>
            )}
            <div ref={scrollRef} className="h-6"/>
          </div>
        </div>

        <div className="p-4 md:p-8 shrink-0 bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5">
          <div className="max-w-3xl mx-auto">
            {attachedImage && (
              <div className="mb-4 p-2 bg-blue-600/5 border border-blue-600/20 rounded-2xl w-fit flex items-center gap-3 animate-in zoom-in">
                <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="prev"/>
                <button onClick={() => setAttachedImage(null)} className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors"><CloseIcon size={16} className="text-red-500"/></button>
              </div>
            )}
            
            <div className="relative flex items-end gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-2.5 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/5 transition-all shadow-xl">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const r = new FileReader();
                    r.onload = () => setAttachedImage({ data: (r.result as string).split(',')[1], mimeType: file.type });
                    r.readAsDataURL(file);
                  }
                }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 text-slate-400 hover:text-blue-600 transition-all rounded-full hover:bg-white dark:hover:bg-white/10 shadow-sm"
                title={t('attachPhoto')}
              >
                <ImageIcon size={22}/>
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={t('askEyad')}
                rows={1}
                className="flex-grow bg-transparent border-none outline-none py-3 px-2 text-base md:text-lg font-bold resize-none max-h-40 placeholder:text-slate-400 dark:text-white"
              />
              
              <button 
                onClick={() => handleSend()} 
                disabled={isSending.current || (!input.trim() && !attachedImage)} 
                className={`p-3.5 rounded-full transition-all active:scale-90 flex items-center justify-center ${
                  isSending.current || (!input.trim() && !attachedImage) 
                    ? 'text-slate-300 dark:text-slate-700 bg-transparent' 
                    : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                }`}
              >
                {isSending.current ? <Loader2 size={24} className="animate-spin"/> : <Send size={24}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
