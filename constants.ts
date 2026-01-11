
import { Language, Theme } from './types';

export const DEFAULT_SETTINGS = {
  language: Language.AR,
  theme: Theme.DARK,
  voiceName: 'adam' 
};

export const VOICE_IDS = ['adam', 'sarah'];

export const MODELS = {
  // Fast and capable for general chat
  GENERAL: 'gemini-2.0-flash', 
  // High reasoning for homework/complex tasks
  COMPLEX: 'gemini-2.0-flash-thinking-exp-01-21', 
  // Native audio capabilities
  LIVE: 'gemini-2.0-flash-exp' 
};

export const VOICE_MAP: Record<string, string> = {
  'adam': 'Puck',
  'sarah': 'Kore'
};
