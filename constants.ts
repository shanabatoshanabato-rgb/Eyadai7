
import { Language, Theme } from './types';

export const DEFAULT_SETTINGS = {
  language: Language.AR,
  theme: Theme.DARK,
  voiceName: 'adam' 
};

export const VOICE_IDS = ['adam', 'sarah'];

export const MODELS = {
  GENERAL: 'gemini-3-flash-preview',
  COMPLEX: 'gemini-3-pro-preview',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

export const VOICE_MAP: Record<string, string> = {
  'adam': 'Zephyr',
  'sarah': 'Kore'
};
