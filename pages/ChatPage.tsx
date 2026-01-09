
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  AlertCircle,
  Loader2,
  BrainCircuit,
  Volume2,
  VolumeX,
  Paperclip,
  X
} from 'lucide-react';
import { generateText, generateSpeech, decode, decodeAudioData } from '../services/geminiService';
import { Message } from '../types';
import { VOICE_MAP, DEFAULT_SETTINGS } from '../constants';
import { useTranslation } from '../translations';

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const t = useTranslation();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!input.trim() && !attachedImage) return;
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input + (attachedImage ? " [صورة مرفقة]" : ""),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = attachedImage;
    setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    try {
      const systemPrompt = `You are Eyad AI. If an image is provided, analyze it thoroughly. Always match user's language. Use formatting for clarity.`;
      const aiResponse = await generateText(currentInput || "Analyze this image", { 
        systemInstruction: systemPrompt,
        image: currentImage || undefined 
      });
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        // FIX: Access .text from aiResponse instead of assigning the whole object
        text: aiResponse.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      setError(err.message === "API_KEY_MISSING" ? "API Key is missing." : "Connection failed.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col max-w-4xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white tracking-tight">{t('chat')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vision Mode Active</p>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <Sparkles className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
            <h1 className="text-2xl font-black mb-2 dark:text-white">أنا إياد، جاهز للمساعدة</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تقدر تسألني أي حاجة أو ترفع صورة لمسألة ونحلها سوا.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`relative group max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'}`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.text}</p>
              {m.role === 'model' && (
                <button onClick={() => speakMessage(m.text, m.id)} className={`mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isPlaying === m.id ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}>
                  {isPlaying === m.id ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isPlaying === m.id ? 'Speaking...' : 'Listen'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-xl flex gap-1 items-center animate-pulse">
              <BrainCircuit className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-slate-500 tracking-tighter uppercase">{t('thinking')}</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {attachedImage && (
        <div className="px-6 py-2 bg-blue-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-blue-200">
            <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="w-full h-full object-cover" />
            <button onClick={() => setAttachedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg">
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Image attached</span>
        </div>
      )}

      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="اسأل إياد عن أي حاجة..."
            className="flex-grow bg-slate-100 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[56px] text-slate-900 dark:text-white font-medium"
            rows={1}
          />
          <button onClick={handleSend} disabled={(!input.trim() && !attachedImage) || isTyping} className="p-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl shadow-lg flex items-center justify-center">
            {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};
