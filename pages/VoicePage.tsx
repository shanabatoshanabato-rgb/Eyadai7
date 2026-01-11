
import React, { useState, useRef, useEffect } from 'react';
import { PhoneCall, StopCircle, Mic, Zap, Loader2, MicOff, Globe } from 'lucide-react';
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

    sourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    sourcesRef.current.clear();

    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (inputContextRef.current) { try { inputContextRef.current.close(); } catch(e) {} inputContextRef.current = null; }
    nextStartTimeRef.current = 0;
  };

  useEffect(() => { return () => { stopEverything(); }; }, []);

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
      const currentLang = (localStorage.getItem('eyad-ai-lang') as Language) || Language.AR;
      
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsCalling(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(2048, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
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
          onclose: () => stopEverything(),
          onerror: (e) => { console.error(e); stopEverything(); setError("Connection lost."); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_MAP[voice] || 'Zephyr' } } },
          systemInstruction: `You are Eyad AI Voice. Target Language: ${currentLang}. Use Google Search. Respond in the user's dialect (Egyptian, Gulf, etc.). Be concise (max 3 sentences).`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Microphone denied or API Key error.");
      stopEverything();
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900 overflow-hidden relative">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isCalling ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="max-w-md w-full text-center relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Real-time Native Audio
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t('voice')}</h1>
          {error ? <p className="text-red-400 font-bold">{error}</p> : <p className="text-slate-400 font-medium">{isCalling ? "إياد بيسمعك دلوقتي..." : t('voiceDesc')}</p>}
        </div>

        <div className={`w-64 h-64 mx-auto rounded-[4rem] border-4 flex items-center justify-center p-4 transition-all duration-700 relative ${
          isCalling ? 'scale-110 border-blue-500 shadow-[0_0_100px_rgba(59,130,246,0.3)] rotate-6' : isConnecting ? 'border-slate-700 animate-pulse' : 'border-slate-800 scale-100'
        }`}>
          {isCalling ? (
            <div className="flex items-center gap-1.5 h-20">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="w-2.5 bg-blue-500 rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDuration: `${0.4 + Math.random() * 0.4}s` }} />
              ))}
            </div>
          ) : isConnecting ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <PhoneCall className="w-16 h-16 text-slate-700" />
          )}
        </div>

        <button
          onClick={isCalling || isConnecting ? stopEverything : startCall}
          disabled={isConnecting && !isCalling}
          className={`px-12 py-6 rounded-[2.5rem] font-black text-xl transition-all flex items-center gap-4 mx-auto shadow-2xl active:scale-95 ${
            isCalling || isConnecting ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700'
          }`}
        >
          {isCalling || isConnecting ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {isConnecting && !isCalling ? "Connecting..." : isCalling ? t('endCall') : t('startVoice')}
        </button>
      </div>
    </div>
  );
};
