
import { Language, Theme } from './types';

export const DEFAULT_SETTINGS = {
  language: Language.AR,
  theme: Theme.DARK,
  voiceName: 'eyad' 
};

// معرفات الأصوات الثابتة (IDs)
export const VOICE_IDS = ['eyad', 'sarah', 'adam', 'zainab', 'mahmoud', 'ahmed'];

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  AUDIO: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

/**
 * خريطة الأصوات التقنية:
 * تربط المعرف (ID) بالصوت الخاص بجوجل
 */
export const VOICE_MAP: Record<string, string> = {
  'eyad': 'Charon',
  'sarah': 'Kore',
  'adam': 'Zephyr',
  'zainab': 'Kore',
  'mahmoud': 'Fenrir',
  'ahmed': 'Puck'
};
