
import { Language, Theme } from './types';

export const DEFAULT_SETTINGS = {
  language: Language.EN,
  theme: Theme.DARK,
  voiceName: 'Eyad'
};

export const VOICES = ['Eyad', 'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  AUDIO: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

// Maps our custom names to Gemini prebuilt voices
export const VOICE_MAP: Record<string, string> = {
  'Eyad': 'Fenrir', // Deep, distinct masculine voice
  'Zephyr': 'Zephyr',
  'Puck': 'Puck',
  'Charon': 'Charon',
  'Kore': 'Kore',
  'Fenrir': 'Fenrir'
};
