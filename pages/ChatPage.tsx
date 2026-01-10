
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  Globe,
  ExternalLink,
  RefreshCcw,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Edit2,
  Check
} from 'lucide-react';
import { generateText, generateSpeech, decode, decodeAudioData } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { VOICE_MAP, DEFAULT_SETTINGS } from '../constants';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const t = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('eyad-ai-sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const lastActive = localStorage.getItem('eyad-ai-active-session');
    return lastActive || null;
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );

  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('eyad-ai-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('eyad-ai-active-session', currentSessionId);
    } else {
      localStorage.removeItem('eyad-ai-active-session');
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: t('newChat'),
      messages: [],
      lastTimestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const deleteMessage = (msgId: string) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.filter(m => m.id !== msgId)
        };
      }
      return s;
    }));
  };

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(title);
  };

  const saveRenamedTitle = (id: string) => {
    if (editTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle.trim() } : s));
    }
    setEditingSessionId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedImage({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const speakMessage = async (text: string, id: string) => {
    if (isPlaying === id) return;
    setIsPlaying(id);
    try {
      const voice = localStorage.getItem('eyad-ai-voice') || DEFAULT_SETTINGS.voiceName;
      const apiVoice = VOICE_MAP[voice] || 'Kore';
      const base64Audio = await generateSpeech(text, apiVoice);
      if (base64Audio) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else setIsPlaying(null);
    } catch (e) { setIsPlaying(null); }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;
    setError(null);

    let activeId = currentSessionId;
    let currentSessions = [...sessions];

    if (!activeId) {
      const newS: ChatSession = {
        id: Date.now().toString(),
        title: input.trim().substring(0, 30) || t('newChat'),
        messages: [],
        lastTimestamp: Date.now()
      };
      currentSessions = [newS, ...currentSessions];
      activeId = newS.id;
      setSessions(currentSessions);
      setCurrentSessionId(activeId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const currentInput = input;
    const currentImage = attachedImage;
    setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    setSessions(prev => prev.map(s => {
      if (s.id === activeId) {
        const isFirst = s.messages.length === 0;
        return {
          ...s,
          title: isFirst ? currentInput.trim().substring(0, 30) || s.title : s.title,
          messages: [...s.messages, userMsg],
          lastTimestamp: Date.now()
        };
      }
      return s;
    }));

    try {
      const systemPrompt = "You are Eyad AI, a helpful assistant. Be concise and accurate. Use Google Search for facts.";
      
      const aiResponse = await generateText(currentInput || "Analyze this image", { 
        systemInstruction: systemPrompt,
        image: currentImage || undefined,
        useSearch: true
      });
      
      if (!aiResponse.text) throw new Error("EMPTY_RESPONSE");

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse.text,
        timestamp: Date.now(),
        sources: aiResponse.sources
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeId) {
          return { ...s, messages: [...s.messages, modelMsg], lastTimestamp: Date.now() };
        }
        return s;
      }));

    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(err.message === "API_KEY_MISSING" ? "API Key error. Please check settings." : "Connection failed. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 lg:z-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full w-80 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={createNewSession}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> {t('newChat')}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-3 space-y-1">
            <div className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4" /> {t('chatHistory')}
            </div>
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => {
                  if (editingSessionId === s.id) return;
                  setCurrentSessionId(s.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`
                  group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border
                  ${currentSessionId === s.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}
                `}
              >
                <div className="flex items-center gap-3 truncate flex-grow">
                  <MessageSquare className={`w-4.5 h-4.5 flex-shrink-0 ${currentSessionId === s.id ? 'text-blue-500' : 'text-slate-400'}`} />
                  {editingSessionId === s.id ? (
                    <input
                      autoFocus
                      className="bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-0.5 w-full outline-none text-sm font-bold text-slate-900 dark:text-white"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRenamedTitle(s.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRenamedTitle(s.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-sm font-bold tracking-tight">{s.title}</span>
                  )}
                </div>
                
                {editingSessionId !== s.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => startEditing(s.id, s.title, e)}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-all"
                      title={t('rename')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(s.id, e)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                      title={t('deleteChat')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {editingSessionId === s.id && (
                  <button onClick={() => saveRenamedTitle(s.id)} className="p-1.5 bg-blue-500 text-white rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden w-full">
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h2 className="font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[200px]">
                  {currentSession?.title || t('chat')}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Globe className="w-3 h-3 text-green-500" /> Online & Fast
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={createNewSession}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors lg:hidden"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button 
              onClick={() => { if(confirm(t('clearHistory') + "?")) { setSessions([]); setCurrentSessionId(null); setError(null); localStorage.removeItem('eyad-ai-sessions'); } }} 
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title={t('clearHistory')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in duration-700">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse rounded-full" />
                <Sparkles className="w-16 h-16 text-blue-500 relative" />
              </div>
              <h1 className="text-3xl font-black mb-3 dark:text-white leading-tight">{t('chatWelcomeTitle')}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t('chatWelcomeDesc')}</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`relative group max-w-[90%] md:max-w-[85%] p-4 rounded-3xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                {/* Individual Message Delete Button */}
                <button 
                  onClick={() => deleteMessage(m.id)}
                  className={`absolute -top-2 ${m.role === 'user' ? '-left-2' : '-right-2'} p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-10`}
                  title={t('deleteChat')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">{m.text}</p>
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((src, idx) => (
                        <a 
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {m.role === 'model' && (
                  <button 
                    onClick={() => speakMessage(m.text, m.id)} 
                    className={`mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${isPlaying === m.id ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                  >
                    {isPlaying === m.id ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                    {isPlaying === m.id ? 'Speaking...' : 'Listen'}
                  </button>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-3xl rounded-tl-none flex gap-3 items-center shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{t('thinking')}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900 rounded-2xl text-red-600 flex items-center gap-4 animate-in shake duration-500">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Error Detected</p>
                <p className="text-sm font-bold">{error}</p>
              </div>
              <button onClick={handleSend} className="p-2 bg-red-100 dark:bg-red-800 rounded-xl hover:bg-red-200 dark:hover:bg-red-700 transition-colors">
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-4xl mx-auto space-y-3">
            {attachedImage && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 w-fit animate-in slide-in-from-bottom-2">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-full h-full object-cover" />
                  <button onClick={() => setAttachedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg hover:bg-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pr-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Attachment</p>
                  <p className="text-[10px] font-bold text-blue-400">Ready to analyze</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 md:gap-3">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 flex-shrink-0"
                title="Attach Image"
              >
                <Paperclip className="w-6 h-6" />
              </button>
              
              <div className="flex-grow relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 1024) { 
                      e.preventDefault(); 
                      handleSend(); 
                    } 
                  }}
                  placeholder="اسأل إياد عن أي حاجة..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-5 py-4 outline-none resize-none min-h-[56px] max-h-40 text-slate-900 dark:text-white font-medium transition-all shadow-inner"
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSend} 
                disabled={(!input.trim() && !attachedImage) || isTyping} 
                className="p-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
              >
                {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
