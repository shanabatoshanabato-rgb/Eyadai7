
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { MODELS } from "../constants";

const getApiKey = () => {
  // محاولة جلب المفتاح بكل الطرق الممكنة في بيئة Vercel/Vite
  const key = 
    (import.meta as any).env?.VITE_API_KEY || 
    process.env.API_KEY || 
    (window as any).process?.env?.API_KEY;

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

export async function* generateTextStream(prompt: string, options?: GenerateOptions) {
  const ai = getAI();
  const modelName = 'gemini-3-flash-preview';
  
  const parts: any[] = [{ text: prompt }];
  if (options?.image) {
    parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
  }

  const config: any = {
    systemInstruction: options?.systemInstruction || "You are Eyad AI, an ultra-fast accurate assistant.",
    temperature: 0.1,
    topP: 0.9,
    responseMimeType: options?.responseMimeType,
  };

  if (options?.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts },
      config
    });

    let fullText = "";
    let sources: { title: string; uri: string }[] = [];

    for await (const chunk of result) {
      const text = chunk.text || "";
      fullText += text;
      
      const groundingMetadata = (chunk as any).candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((c: any) => {
          if (c.web?.uri) {
            const exists = sources.find(s => s.uri === c.web.uri);
            if (!exists) sources.push({ title: c.web.title || c.web.uri, uri: c.web.uri });
          }
        });
      }

      yield { text, fullText, sources, done: false };
    }

    yield { text: "", fullText, sources, done: true };
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    // تحويل الأخطاء الفنية لرسائل مفهومة
    if (error.message?.includes('429')) throw new Error("QUOTA_EXCEEDED");
    if (error.message?.includes('403') || error.message?.includes('401')) throw new Error("INVALID_API_KEY");
    throw error;
  }
}

export const generateText = async (prompt: string, options?: GenerateOptions): Promise<AIResponse> => {
  const ai = getAI();
  const parts: any[] = [{ text: prompt }];
  if (options?.image) parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: options?.systemInstruction,
      temperature: 0.1,
      tools: options?.useSearch ? [{ googleSearch: {} }] : [],
      responseMimeType: options?.responseMimeType,
    }
  });

  const sources: any[] = [];
  const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((c: any) => {
      if (c.web) sources.push({ title: c.web.title || c.web.uri, uri: c.web.uri });
    });
  }

  return { text: response.text || "", sources };
};

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
 * Decodes a base64 string to a Uint8Array.
 */
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array to a base64 string.
 */
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio data (Uint8Array) to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
