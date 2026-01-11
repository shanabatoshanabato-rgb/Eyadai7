
import { Language, Theme } from './types';

export const DEFAULT_SETTINGS = {
  language: Language.AR,
  theme: Theme.DARK,
  voiceName: 'adam' 
};

// معرفات الأصوات المتاحة (فقط آدم وسارة)
export const VOICE_IDS = ['adam', 'sarah'];

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  AUDIO: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

/**
 * خريطة الأصوات التقنية:
 * آدم (Zephyr - صوت ذكر)
 * سارة (Kore - صوت أنثى)
 */
export const VOICE_MAP: Record<string, string> = {
  'adam': 'Zephyr',
  'sarah': 'Kore'
};
