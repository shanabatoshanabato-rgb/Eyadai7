
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
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

/**
 * وظيفة البث المباشر (Streaming) للحصول على أسرع استجابة ممكنة مع استخراج المصادر
 */
export async function* generateTextStream(prompt: string, options?: GenerateOptions) {
  const ai = getAI();
  const modelName = 'gemini-3-flash-preview';
  
  const parts: any[] = [{ text: prompt }];
  if (options?.image) {
    parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
  }

  const config: any = {
    systemInstruction: options?.systemInstruction || "You are Eyad AI, a high-speed, accurate engineer.",
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
      
      // استخراج المصادر من Grounding Metadata
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
    throw error;
  }
}

/**
 * الدالة القديمة للإبقاء على التوافق مع صفحات أخرى
 */
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
