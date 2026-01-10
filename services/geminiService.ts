
import { GoogleGenAI, Modality } from "@google/genai";
import { MODELS } from "../constants";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null' || key === '') {
    return null;
  }
  return key;
};

// Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
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
 * Robust JSON extraction utility.
 * Cleans markdown, handles conversational prefixes, and extracts valid JSON objects or arrays.
 */
export const extractJson = (text: string) => {
  try {
    // 1. Basic cleanup of markdown and whitespace
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. Identify the outermost structure (object or array)
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    // Determine which structure starts first
    let startChar = '';
    let endChar = '';
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startChar = '{';
      endChar = '}';
    } else if (firstBracket !== -1) {
      startChar = '[';
      endChar = ']';
    }

    if (startChar) {
      startIdx = cleaned.indexOf(startChar);
      endIdx = cleaned.lastIndexOf(endChar);
    }

    if (startIdx === -1 || endIdx === -1) {
      // Fallback: try to parse the cleaned text directly
      return JSON.parse(cleaned);
    }
    
    const jsonStr = cleaned.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Critical JSON Parse Error:", e, "Input Text:", text);
    throw new Error("FAILED_TO_PARSE_JSON");
  }
};

const TEXT_MODELS_FALLBACK = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest'
];

export const generateText = async (prompt: string, options?: GenerateOptions): Promise<AIResponse> => {
  let lastError: any = null;
  
  // Use recommended model names from guidelines
  const modelsToTry = options?.image 
    ? ['gemini-3-flash-preview', 'gemini-flash-latest'] 
    : (options?.useSearch ? ['gemini-3-flash-preview', 'gemini-flash-latest'] : TEXT_MODELS_FALLBACK);

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
        systemInstruction: options?.systemInstruction || "You are Eyad AI, a professional tutor.",
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for immediate output to avoid timeouts
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

      // Use .text property as per instructions
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
      console.warn(`Model ${modelName} failed, trying next...`, error.message);
      lastError = error;
      if (error.message?.includes('429') || error.status === 429) continue; 
      throw error;
    }
  }
  throw lastError;
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
