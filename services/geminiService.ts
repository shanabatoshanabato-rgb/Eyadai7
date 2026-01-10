
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

// Helper to extract JSON from text that might contain markdown or extra words
export const extractJson = (text: string) => {
  try {
    // 1. Remove markdown code blocks (```json ... ```)
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Try to find the first valid JSON object OR Array
    // This regex looks for anything starting with { and ending with } OR starting with [ and ending with ]
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // 3. Fallback: try parsing the whole text
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original Text:", text);
    throw new Error("FAILED_TO_PARSE_JSON");
  }
};

const TEXT_MODELS_FALLBACK = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash-latest',
  'gemini-2.0-flash-exp',
  'gemini-flash-lite-latest'
];

export const generateText = async (prompt: string, options?: GenerateOptions): Promise<AIResponse> => {
  let lastError: any = null;
  
  // Priority: 
  // 1. gemini-3-flash-preview (Smartest fast model)
  // 2. gemini-2.5-flash-latest (Reliable fallback)
  const modelsToTry = options?.image 
    ? ['gemini-2.5-flash-latest', 'gemini-3-flash-preview'] // 2.5 is often better/faster for single images currently
    : (options?.useSearch ? ['gemini-2.5-flash-latest', 'gemini-3-flash-preview'] : TEXT_MODELS_FALLBACK);

  for (const modelName of modelsToTry) {
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
        systemInstruction: options?.systemInstruction || "You are Eyad AI, a helpful assistant.",
        thinkingConfig: { thinkingBudget: 0 }
      };

      if (options?.responseMimeType && !options?.useSearch) {
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

      const text = response.text || '';
      const sources: { title: string; uri: string }[] = [];

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri
            });
          }
        });
      }

      return { text, sources };
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // If error is related to API Key, stop retrying immediately
      if (error.message?.includes("API_KEY") || error.message?.includes("403")) {
        throw error;
      }
      // Continue to next model on other errors
      continue; 
    }
  }
  throw lastError;
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
