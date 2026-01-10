
import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  StopCircle, 
  Mic, 
  AlertCircle,
  Zap
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

  const stopEverything = () => {
    // 1. Force state to false immediately to block pending sends
    setIsCalling(false);

    // 2. Kill Gemini Session
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }

    // 3. Stop Microphone Hard
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 4. Disconnect and stop processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    // 5. Silence all sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); source.disconnect(); } catch(e) {}
    });
    sourcesRef.current.clear();

    // 6. Close Contexts
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
    // Handle Tab/Window Change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionRef.current) {
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

  const endCall = () => {
    stopEverything();
  };

  const startCall = async () => {
    try {
      setError(null);
      const ai = getAI();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      await inputCtx.resume();
      await outputCtx.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredVoice = localStorage.getItem('eyad-ai-voice') || DEFAULT_SETTINGS.voiceName;
      const apiVoiceName = VOICE_MAP[preferredVoice] || 'Fenrir';
      
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            if (!inputContextRef.current || !streamRef.current) return;

            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;

              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };
            
            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: any) => {
            if (!audioContextRef.current || !sessionRef.current) return;

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              try {
                const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
                if (!audioContextRef.current || !sessionRef.current) return;
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                
                sourcesRef.current.add(source);
                source.onended = () => {
                   sourcesRef.current.delete(source);
                   source.disconnect();
                };
              } catch (e) {}
            }
            
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); s.disconnect(); } catch(e){} });
              sourcesRef.current.clear();
              if (audioContextRef.current) {
                nextStartTimeRef.current = audioContextRef.current.currentTime;
              }
            }
          },
          onclose: () => {
            stopEverything();
          },
          onerror: (e) => {
            console.error("Live Error", e);
            setError("Unexpected Error. Restarting call...");
            stopEverything();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: apiVoiceName 
              } 
            } 
          },
          systemInstruction: "You are Eyad AI. Be friendly, keep answers short for voice chat. Match the user's language."
        }
      });

      setIsCalling(true);
      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      setError("Microphone or connection error");
      stopEverything();
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="max-w-md w-full text-center relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-xs font-black uppercase tracking-[0.2em] border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Ultra-Low Latency
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">{t('voice')}</h1>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> 
              <span className="text-sm">{error}</span>
            </div>
          )}
          {!error && <p className="text-slate-400 font-medium px-4">{t('voiceDesc')}</p>}
        </div>

        <div className="relative">
          <div className={`w-48 h-48 mx-auto rounded-full border-4 border-slate-800 flex items-center justify-center p-4 transition-all duration-700 ${isCalling ? 'scale-110 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'scale-100'}`}>
            {isCalling ? (
              <div className="flex items-center gap-1.5 h-16">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div 
                    key={i} 
                    className="w-2.5 bg-blue-500 rounded-full animate-voice-pulse" 
                    style={{ animationDelay: `${i * 0.1}s`, height: '100%' }}
                  />
                ))}
              </div>
            ) : (
              <PhoneCall className={`w-16 h-16 ${error ? 'text-red-500/50' : 'text-slate-600'}`} />
            )}
          </div>
        </div>

        <div>
          {!isCalling ? (
            <button
              onClick={startCall}
              className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-4 mx-auto"
            >
              <Mic className="w-6 h-6" /> {t('startVoice')}
            </button>
          ) : (
            <button
              onClick={endCall}
              className="px-12 py-5 bg-red-600 text-white rounded-[2rem] font-black text-xl hover:bg-red-700 hover:scale-105 transition-all shadow-2xl shadow-red-600/40 flex items-center gap-4 mx-auto"
            >
              <StopCircle className="w-6 h-6" /> {t('endCall')}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes voice-pulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
        .animate-voice-pulse {
          animation: voice-pulse 0.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
