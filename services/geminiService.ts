
import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../constants";

// --- Configuration ---
const API_KEY = process.env.API_KEY;

export const getAI = () => {
  if (!API_KEY) throw new Error("MISSING_API_KEY");
  return new GoogleGenAI({ apiKey: API_KEY });
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
    // Fallback: try to return text wrapped in object if parse fails
    return { error: "FORMAT_ERROR", raw: text };
  }
};

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  image?: { data: string; mimeType: string };
  useSearch?: boolean;
  responseMimeType?: string;
  history?: ChatMessage[];
  task?: string; 
}

// --- Main Functions ---

export async function* generateTextStream(prompt: string, options?: GenerateOptions) {
  const ai = getAI();
  const modelName = options?.model || MODELS.GENERAL;
  const system = options?.systemInstruction || "You are Eyad AI.";

  // Prepare Contents
  let contents: any[] = [];

  if (options?.history && options.history.length > 0) {
    contents = options.history.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, 
      parts: [{ text: msg.content }]
    }));
  } else {
    contents = [{ role: 'user', parts: [{ text: prompt }] }];
  }

  // Handle Image attachment (attach to the last user message)
  if (options?.image) {
    const lastMsg = contents[contents.length - 1];
    if (lastMsg.role === 'user') {
      lastMsg.parts.push({ 
        inlineData: { 
          data: options.image.data, 
          mimeType: options.image.mimeType 
        } 
      });
    } else {
      contents.push({
        role: 'user',
        parts: [
          { text: "" },
          { inlineData: { data: options.image.data, mimeType: options.image.mimeType } }
        ]
      });
    }
  }

  // Configuration
  const config: any = {
    systemInstruction: system,
    temperature: 0.7,
    responseMimeType: options?.responseMimeType,
  };

  // Enable Google Search Grounding if requested
  if (options?.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config
    });

    let fullText = "";
    let sources: { title: string; uri: string }[] = [];

    for await (const chunk of result) {
      const text = chunk.text || "";
      fullText += text;
      
      // Extract Grounding Metadata (Search Results)
      const groundingMetadata = (chunk as any).candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((c: any) => {
          if (c.web?.uri && !sources.find(s => s.uri === c.web.uri)) {
            sources.push({ title: c.web.title || c.web.uri, uri: c.web.uri });
          }
        });
      }
      
      yield { text, fullText, sources };
    }
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    if (error.message?.includes("429")) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
}

export const generateText = async (prompt: string, options?: GenerateOptions) => {
  const ai = getAI();
  const system = options?.systemInstruction || "You are Eyad AI.";
  
  // Select Model: Use Thinking model for complex tasks (Homework/Irab), General for others
  let modelName = options?.model || MODELS.GENERAL;
  if (options?.task === 'homework' || options?.task === 'irab' || options?.task === 'writing') {
    modelName = MODELS.COMPLEX;
  }

  // Construct contents
  const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
  
  if (options?.image) {
    contents[0].parts.push({ 
      inlineData: { 
        data: options.image.data, 
        mimeType: options.image.mimeType 
      } 
    });
  }

  const config: any = {
    systemInstruction: system,
    responseMimeType: options?.responseMimeType,
    // Increase output limit for complex tasks
    maxOutputTokens: options?.task === 'writing' ? 4000 : 2000, 
  };
  
  // Thinking config is handled automatically by the model choice (flash-thinking)
  // but we can ensure budget if needed, though default is usually fine.

  if (options?.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config
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
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

// --- Audio Helpers (Native Browser & Live API) ---

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
