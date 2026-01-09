
export enum Language {
  EN = 'en',
  AR = 'ar',
  EG = 'arz',
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
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  voiceName: string;
}

export interface GeneratedDoc {
  title: string;
  content: string;
  references: string[];
}
