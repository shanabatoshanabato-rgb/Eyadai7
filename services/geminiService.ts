
import { GoogleGenAI, Modality } from "@google/genai";
import { MODELS } from "../constants";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null' || key === '') {
    return null;
  }
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
    let cleaned = text.trim();
    const startBrace = cleaned.indexOf('{');
    const startBracket = cleaned.indexOf('[');
    const endBrace = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
      start = startBrace;
      end = endBrace;
    } else if (startBracket !== -1) {
      start = startBracket;
      end = endBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = cleaned.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("FAILED_TO_PARSE_JSON");
  }
};

export const generateText = async (prompt: string, options?: GenerateOptions): Promise<AIResponse> => {
  // استخدام gemini-3-flash-preview للسرعة القصوى والاستقرار
  const modelName = 'gemini-3-flash-preview';
  let lastError: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ai = getAI();
      const parts: any[] = [{ text: prompt }];
      
      if (options?.image) {
        parts.push({
          inlineData: { data: options.image.data, mimeType: options.image.mimeType }
        });
      }

      const config: any = {
        systemInstruction: options?.systemInstruction || "You are Eyad AI, a highly accurate and professional assistant.",
        temperature: 0.1, // أقل قيمة ممكنة لضمان الدقة المعلوماتية وعدم التخمين
        topP: 0.8,
        topK: 40,
      };

      if (options?.responseMimeType === "application/json") {
        config.responseMimeType = "application/json";
      }

      // تفعيل البحث لضمان تحديث المعلومات ودقتها
      if (options?.useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config
      });

      if (!response.text) throw new Error("EMPTY_RESPONSE");

      const text = response.text;
      const sources: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
          }
        });
      }

      return { text, sources };
    } catch (error: any) {
      lastError = error;
      const status = error.status || (error.message?.includes('429') ? 429 : 500);
      
      if (status === 429 || status === 503 || status === 500) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1))); 
        continue;
      }
      break; 
    }
  }
  
  if (lastError?.status === 429) throw new Error("RATE_LIMIT_EXCEEDED");
  throw lastError || new Error("CONNECTION_ERROR");
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.AUDIO,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO], // تم تصحيح الكلمة هنا لإنهاء خطأ الـ Build
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
