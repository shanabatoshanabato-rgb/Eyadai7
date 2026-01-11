
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
  AlertCircle,
  RefreshCcw,
  Edit2,
  Check,
  X as CloseIcon,
  Trash
} from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { Message, ChatSession } from '../types';

export const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-sessions-v5');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('eyad-ai-active-session-v5');
  });

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
      text: pText || "تحليل صورة",
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    let sId = activeId;
    if (!sId) {
      sId = "s_" + Date.now();
      const newSession: ChatSession = {
        id: sId,
        title: pText.substring(0, 20) || "محادثة جديدة",
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
        useSearch: true,
        image: backupImg || undefined,
        systemInstruction: "You are Eyad AI, a helpful educational assistant. Provide direct and accurate info."
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
      setError("حصل مشكلة في الاتصال.");
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
    <div className="flex h-[calc(100vh-80px)] bg-[#020617] text-white overflow-hidden relative">
      
      {/* Persistent Sidebar */}
      <div className="w-64 bg-[#020617] border-e border-white/5 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <span className="font-bold text-xs flex items-center gap-2 text-slate-500 uppercase tracking-widest">
            <History size={14}/> السجل
          </span>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setActiveId(null)}
            className="w-full py-2.5 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <Plus size={16}/> محادثة جديدة
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setActiveId(s.id)}
              className={`group px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-3 transition-all border ${
                activeId === s.id 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare size={14} className="shrink-0"/>
              {editingId === s.id ? (
                <input
                  autoFocus
                  className="bg-slate-800 text-white text-xs px-2 py-1 rounded w-full outline-none border border-blue-500"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') saveTitle(s.id); if(e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-xs font-bold truncate flex-grow leading-tight">{s.title}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(s.id, s.title); }}
                      className="p-1 hover:text-white"
                    >
                      <Edit2 size={12}/>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if(activeId === s.id) setActiveId(null); }}
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#020617] relative">
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#020617]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black tracking-tight truncate max-w-[300px]">
              {currentSession ? currentSession.title : "New Chat"}
            </h2>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && !streamingText && (
              <div className="py-20 text-center space-y-6 animate-in fade-in">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-600/20">
                  <Sparkles size={32} className="text-blue-600 animate-pulse"/>
                </div>
                <h3 className="text-xl font-black">أهلاً بك! أنا إياد.</h3>
                <p className="text-slate-500 text-sm">اسأل أي حاجة، أنا هنا عشان أساعدك.</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`max-w-[85%] relative ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10'} p-4 rounded-2xl shadow-sm`}>
                  
                  {/* Individual Delete Button */}
                  <button 
                    onClick={() => deleteMessage(m.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                    title="حذف الرسالة"
                  >
                    <Trash size={12}/>
                  </button>

                  {m.image && <img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="max-w-full rounded-lg mb-3 border border-white/10" alt="sent"/>}
                  <p className="whitespace-pre-wrap font-bold text-sm leading-relaxed">{m.text}</p>
                  
                  <div className={`text-[9px] mt-2 opacity-40 uppercase tracking-widest font-black ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.role === 'user' ? 'أنت' : 'إياد AI'}
                  </div>
                </div>
              </div>
            ))}

            {(streamingText || isTyping) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white/5 border border-white/10 p-4 rounded-2xl">
                  {isTyping && !streamingText ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-bold text-sm leading-relaxed">{streamingText}</p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center text-xs font-bold animate-pulse">
                {error}
              </div>
            )}
            <div ref={scrollRef} className="h-4"/>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-6 shrink-0 bg-[#020617]">
          <div className="max-w-3xl mx-auto">
            {attachedImage && (
              <div className="mb-2 p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl w-fit flex items-center gap-2">
                <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-10 h-10 rounded object-cover" alt="prev"/>
                <button onClick={() => setAttachedImage(null)}><CloseIcon size={14} className="text-red-500"/></button>
              </div>
            )}
            
            <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all shadow-lg backdrop-blur-sm">
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
                className="p-2.5 text-slate-500 hover:text-blue-500 transition-all rounded-xl"
              >
                <ImageIcon size={20}/>
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="اسأل إياد..."
                rows={1}
                className="flex-grow bg-transparent border-none outline-none py-2 px-1 text-sm font-bold resize-none max-h-32 placeholder:text-slate-600"
              />
              
              <button 
                onClick={() => handleSend()} 
                disabled={isSending.current || (!input.trim() && !attachedImage)} 
                className={`p-2.5 rounded-xl transition-all ${
                  isSending.current || (!input.trim() && !attachedImage) 
                    ? 'text-slate-700 bg-transparent' 
                    : 'bg-blue-600 text-white shadow-md'
                }`}
              >
                {isSending.current ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
