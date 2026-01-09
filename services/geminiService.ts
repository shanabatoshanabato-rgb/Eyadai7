
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

export const generateText = async (prompt: string, options?: GenerateOptions): Promise<string> => {
  try {
    const ai = getAI();
    const parts: any[] = [{ text: prompt }];
    
    if (options?.image) {
      parts.push({
        inlineData: {
          data: options.image.data,
          mimeType: options.image.mimeType
        }
      });
    }

    const config: any = {
      systemInstruction: options?.systemInstruction || "You are Eyad AI, a helpful assistant."
    };

    // إذا كان البحث مفعلاً، نستخدم النموذج الأقوى للتعامل مع الأدوات
    const modelName = options?.useSearch ? 'gemini-3-pro-preview' : MODELS.TEXT;

    if (options?.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }

    if (options?.useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config
    });

    let text = response.text || '';
    
    // إذا لم نكن نطلب JSON، نضيف المصادر بشكل يدوي في نهاية النص
    if (!options?.responseMimeType) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        const sourcesText = chunks
          .filter((c: any) => c.web?.uri)
          .map((c: any) => `- [${c.web.title || c.web.uri}](${c.web.uri})`)
          .join('\n');
        
        if (sourcesText) {
          text += `\n\n### المصادر والمراجع:\n${sourcesText}`;
        }
      }
    }

    return text;
  } catch (error: any) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Image gen error:", err);
    return null;
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
