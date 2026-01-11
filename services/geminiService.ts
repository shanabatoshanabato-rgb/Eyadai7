
import { GoogleGenAI, Modality } from "@google/genai";
import { MODELS } from "../constants";

export const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '') {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const extractJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.search(/\{|\[/);
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    
    if (firstBrace === -1 || lastBrace === -1) return JSON.parse(cleaned);
    return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
  } catch (e) {
    console.error("JSON Error:", e);
    throw new Error("FORMAT_ERROR");
  }
};

interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  image?: { data: string; mimeType: string };
  useSearch?: boolean;
  responseMimeType?: string;
}

export async function* generateTextStream(prompt: string, options?: GenerateOptions) {
  try {
    const ai = getAI();
    const modelName = options?.model || MODELS.GENERAL;
    
    const parts: any[] = [{ text: prompt }];
    if (options?.image) {
      parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
    }

    const config: any = {
      systemInstruction: options?.systemInstruction || "You are Eyad AI, a helpful educational assistant.",
      temperature: 0.7,
      responseMimeType: options?.responseMimeType,
    };

    if (options?.useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

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
      yield { text, fullText, sources };
    }
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    if (error.message?.includes("429")) throw new Error("QUOTA_EXCEEDED");
    if (error.message?.includes("403") || error.message?.includes("401")) throw new Error("INVALID_KEY");
    if (error.message === "MISSING_API_KEY") throw error;
    throw new Error("CONNECTION_FAILED");
  }
}

export const generateText = async (prompt: string, options?: GenerateOptions) => {
  try {
    const ai = getAI();
    const parts: any[] = [{ text: prompt }];
    if (options?.image) parts.push({ inlineData: { data: options.image.data, mimeType: options.image.mimeType } });
    
    const response = await ai.models.generateContent({
      model: options?.model || MODELS.COMPLEX,
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
  } catch (error: any) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

export const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
