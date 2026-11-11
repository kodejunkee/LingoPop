import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { getStoredBoolean, StorageKeys } from '../storage/mmkv';

let audioModeConfigured = false;
let cachedMandarinVoiceId: string | undefined;
let voiceLookupAttempted = false;

async function ensureAudioConfigured(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
    audioModeConfigured = true;
  } catch {
    // Safe fallback if audio mode configuration is unsupported on device
  }
}

async function resolveMandarinVoice(): Promise<string | undefined> {
  if (voiceLookupAttempted) {
    return cachedMandarinVoiceId;
  }
  voiceLookupAttempted = true;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const zhVoices = voices.filter((v) =>
      v.language.toLowerCase().startsWith('zh')
    );

    // Prefer Mainland Mandarin (zh-CN / zh_CN) and Enhanced quality when present
    const preferred =
      zhVoices.find(
        (v) =>
          v.language.toLowerCase().includes('cn') &&
          v.quality === Speech.VoiceQuality.Enhanced
      ) ??
      zhVoices.find((v) => v.language.toLowerCase().includes('cn')) ??
      zhVoices[0];

    cachedMandarinVoiceId = preferred?.identifier;
  } catch {
    cachedMandarinVoiceId = undefined;
  }

  return cachedMandarinVoiceId;
}

export interface SpeakMandarinOptions {
  /** True plays at 0.7x speed for crystal-clear tone articulation */
  slow?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
}

/**
 * Stops any ongoing Mandarin speech immediately so audio never overlaps across screens.
 */
export async function stopMandarinSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // Ignore stop errors on unsupported web contexts
  }
}

/**
 * Speaks Mandarin text (pass Hanzi characters rather than raw Pinyin so native TTS
 * voices pronounce exact tones accurately).
 */
export async function speakMandarin(
  hanziText: string,
  options: SpeakMandarinOptions = {}
): Promise<void> {
  if (!getStoredBoolean(StorageKeys.SOUND_ENABLED, true)) {
    options.onDone?.();
    return;
  }

  await ensureAudioConfigured();
  await stopMandarinSpeech();

  const voice = await resolveMandarinVoice();
  const rate = options.slow ? 0.58 : 0.88;

  Speech.speak(hanziText, {
    language: 'zh-CN',
    voice,
    rate,
    pitch: 1.0,
    onStart: () => {
      options.onStart?.();
    },
    onDone: () => {
      options.onDone?.();
    },
    onStopped: () => {
      options.onDone?.();
    },
    onError: () => {
      options.onError?.();
      options.onDone?.();
    },
  });
}
