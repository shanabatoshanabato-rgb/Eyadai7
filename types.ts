
export enum Language {
  EN = 'en',
  AR = 'ar',
  DIALECT = 'dialect',
  FR = 'fr',
  ES = 'es'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  audioUrl?: string;
  sources?: { title: string; uri: string }[];
  image?: { data: string; mimeType: string };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastTimestamp: number;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  voiceName: string;
}
