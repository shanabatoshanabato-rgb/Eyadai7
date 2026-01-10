
import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  StopCircle, 
  Mic, 
  Zap,
  Loader2
} from 'lucide-react';
import { getAI, decode, decodeAudioData, encode } from '../services/geminiService';
import { MODELS, VOICE_MAP, DEFAULT_SETTINGS } from '../constants';
import { Modality } from '@google/genai';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const VoicePage: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const t = useTranslation();

  const stopEverything = async () => {
    setIsCalling(false);
    setIsConnecting(false);

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    sourcesRef.current.forEach(source => {
      try { source.stop(); source.disconnect(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      try { inputContextRef.current.close(); } catch(e) {}
      inputContextRef.current = null;
    }
    
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    // FIX: Do not return the async call directly to avoid the Promise return type error
    return () => {
      stopEverything();
    };
  }, []);

  const startCall = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      const ai = getAI();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const voice = localStorage.getItem('eyad-ai-voice') || DEFAULT_SETTINGS.voiceName;
      const apiVoiceName = VOICE_MAP[voice] || 'Charon';
      const currentLang = (localStorage.getItem('eyad-ai-lang') as Language) || Language.AR;
      
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsCalling(true);
            if (!inputContextRef.current || !streamRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputContextRef.current.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ 
                  media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: any) => {
            if (!audioContextRef.current) return;
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => { sourcesRef.current.delete(source); source.disconnect(); };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => { stopEverything(); },
          onerror: () => { stopEverything(); },
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: apiVoiceName } } },
          systemInstruction: `You are Eyad AI, a multi-lingual master assistant.
          Current System Language Preference: ${currentLang}.
          
          DYNAMIC BEHAVIOR RULES:
          1. DETECT & MATCH: Listen to the user's language and dialect. Respond EXACTLY in the same language and dialect. 
             If they speak Spanish, respond in Spanish. If they speak Egyptian Arabic, respond in Egyptian. If they speak Gulf Arabic, match that.
          2. SPEED: Respond instantly. Zero latency is the goal.
          3. RESPONSE STYLE: Keep answers high-quality but concise (2-4 sentences). 
          4. SEARCH: Use Google Search to ensure facts are updated and correct.
          5. NO FILLERS: Never say "Searching..." or "One moment". Just provide the answer as if you already knew it.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Microphone access denied or connection failed.");
      stopEverything();
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden relative">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isCalling ? 'opacity-20' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="max-w-md w-full text-center relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Multi-Dialect Ready
          </div>
          <h1 className="text-4xl font-black text-white">{t('voice')}</h1>
          {error && <p className="text-red-400 font-bold">{error}</p>}
          {!error && <p className="text-slate-400">{isCalling ? "Eyad is listening..." : t('voiceDesc')}</p>}
        </div>

        <div className={`w-56 h-56 mx-auto rounded-full border-4 flex items-center justify-center p-4 transition-all duration-700 relative ${
          isCalling 
            ? 'scale-110 border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.4)]' 
            : isConnecting 
              ? 'border-slate-700 animate-pulse'
              : 'border-slate-800 scale-100'
        }`}>
          {isCalling ? (
            <div className="flex items-center gap-2 h-20">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-2.5 bg-blue-500 rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.6s', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : isConnecting ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <PhoneCall className="w-16 h-16 text-slate-600" />
          )}
        </div>

        <button
          onClick={isCalling || isConnecting ? stopEverything : startCall}
          disabled={isConnecting && !isCalling}
          className={`px-12 py-5 rounded-[2.5rem] font-black text-xl transition-all flex items-center gap-4 mx-auto shadow-2xl active:scale-95 ${
            isCalling || isConnecting 
              ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700' 
              : 'bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700'
          }`}
        >
          {isCalling || isConnecting ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {isConnecting && !isCalling ? "Connecting..." : isCalling ? t('endCall') : t('startVoice')}
        </button>
      </div>
    </div>
  );
};
