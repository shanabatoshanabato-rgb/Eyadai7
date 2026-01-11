
import { GoogleGenAI, Modality } from "@google/genai";
import { MODELS } from "../constants";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null' || key === '') return null;
  return key;
};

export const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

interface GenerateOptions {
  systemInstruction?: string;
  image?: { data: string; mimeType: string };
  useSearch?: boolean;
  responseMimeType?: string;
}

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export const extractJson = (text: string) => {
  try {
    let cleaned = text.trim().replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : cleaned.indexOf('[');
    const end = cleaned.lastIndexOf('}') !== -1 ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1) return JSON.parse(cleaned.substring(start, end + 1));
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("FAILED_TO_PARSE_JSON");
  }
};

/**
 * دالة توليد النصوص المطورة: تضمن السرعة القصوى مع حماية ضد أخطاء 429 أو تعليق البحث
 */
export const generateText = async (prompt: string, options?: GenerateOptions): Promise<AIResponse> => {
  const ai = getAI();
  const modelName = 'gemini-3-flash-preview';
  
  // الكلمات التي تتطلب سرعة خارقة وبدون بحث
  const isSimple = /^(هلا|مرحبا|سلام|كيفك|اخبارك|مين انت|شكرا|تمام|اوكي|ماشي|hi|hello|hey|thanks|ok|who are you)$/i.test(prompt.trim());
  
  const executeRequest = async (withSearch: boolean): Promise<AIResponse> => {
    const parts: any[] = [{ text: prompt }];
    if (options?.image) {
      parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
    }

    const config: any = {
      systemInstruction: options?.systemInstruction || "You are Eyad AI, a high-precision and extremely fast assistant.",
      temperature: 0.1,
      topP: 0.9,
    };

    if (options?.responseMimeType === "application/json") config.responseMimeType = "application/json";
    if (withSearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) sources.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
      });
    }

    return { text: response.text, sources };
  };

  try {
    // المحاولة الأولى: مع البحث إذا طُلب ولم تكن الكلمة بسيطة
    return await executeRequest(options?.useSearch && !isSimple ? true : false);
  } catch (error: any) {
    // إذا حدث أي خطأ (ضغط، 429، فشل بحث)، جرب فوراً بدون بحث كـ Fallback
    if (options?.useSearch && !isSimple) {
      return await executeRequest(false);
    }
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.AUDIO,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    return null;
  }
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
