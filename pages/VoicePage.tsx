
import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  StopCircle, 
  Mic, 
  Zap,
  Globe
} from 'lucide-react';
import { getAI, decode, decodeAudioData, encode } from '../services/geminiService';
import { MODELS, VOICE_MAP, DEFAULT_SETTINGS } from '../constants';
import { Modality } from '@google/genai';
import { useTranslation } from '../translations';

export const VoicePage: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
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
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopEverything();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      stopEverything();
    };
  }, []);

  const startCall = async () => {
    try {
      setError(null);
      const ai = getAI();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const voice = localStorage.getItem('eyad-ai-voice') || DEFAULT_SETTINGS.voiceName;
      const apiVoiceName = VOICE_MAP[voice] || 'Fenrir';
      
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            if (!inputContextRef.current || !streamRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputContextRef.current.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;
            
            // Following guideline: Use sessionPromise.then to send data to avoid stale closures
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
          },
          onclose: () => stopEverything(),
          onerror: () => stopEverything(),
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: apiVoiceName } } },
          systemInstruction: `You are Eyad AI, a ultra-high-performance voice assistant. 
          1. SPEED: Respond instantly. Keep answers under 15 words whenever possible.
          2. LANGUAGE: Detect user language immediately. ALWAYS respond in the EXACT same language as the user.
          3. ACCURACY: You have access to Google Search. Use it to provide factual, real-time answers when needed.
          4. STYLE: No fillers. Friendly but professional.`
        }
      });

      setIsCalling(true);
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Microphone error");
      stopEverything();
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden relative">
      <div className="max-w-md w-full text-center relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Ultra-Fast + <Globe className="w-3.5 h-3.5 ml-1" /> Web
          </div>
          <h1 className="text-4xl font-black text-white">{t('voice')}</h1>
          {error && <p className="text-red-400 font-bold">{error}</p>}
          {!error && <p className="text-slate-400">{t('voiceDesc')}</p>}
        </div>

        <div className={`w-48 h-48 mx-auto rounded-full border-4 border-slate-800 flex items-center justify-center p-4 transition-all duration-700 ${isCalling ? 'scale-110 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'scale-100'}`}>
          {isCalling ? (
            <div className="flex items-center gap-1.5 h-16">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-2 bg-blue-500 rounded-full animate-pulse" style={{ height: '100%', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : (
            <PhoneCall className="w-16 h-16 text-slate-600" />
          )}
        </div>

        <button
          onClick={isCalling ? stopEverything : startCall}
          className={`px-12 py-5 rounded-[2rem] font-black text-xl transition-all flex items-center gap-4 mx-auto ${isCalling ? 'bg-red-600 text-white shadow-red-600/40' : 'bg-blue-600 text-white shadow-blue-600/40'}`}
        >
          {isCalling ? <StopCircle /> : <Mic />}
          {isCalling ? t('endCall') : t('startVoice')}
        </button>
      </div>
    </div>
  );
};
