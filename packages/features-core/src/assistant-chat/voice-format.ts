import { isApiError, isNetworkError } from "@ihsp/api"

/** The longest recording the backend takes (`MAX_SECONDS` of `ai/voice`); the recorder stops here. */
export const VOICE_MAX_MS = 120_000
/** Mono speech at a low bitrate: a short question costs little to transcribe. */
export const VOICE_BITRATE = 16_000
/** Bars of the live waveform when its width is not measured yet. */
export const WAVE_BARS = 48
/** Levels kept for the waveform (the newest ones are the visible bars). */
export const WAVE_HISTORY = 240
/** A waveform bar and the gap after it, in CSS pixels. */
export const WAVE_BAR_PX = 2
export const WAVE_PITCH_PX = 5

/** How many bars fit a waveform of `width` pixels; `WAVE_BARS` while the width is unknown. */
export function waveSlots(width: number): number {
  if (width <= 0) return WAVE_BARS
  return Math.max(1, Math.floor((width + WAVE_PITCH_PX - WAVE_BAR_PX) / WAVE_PITCH_PX))
}

export type RecordingFormat = {
  /** The MIME type handed to `MediaRecorder` (codecs included). */
  recorderType: string
  /** The type the upload carries: the base MIME type, codecs stripped. */
  uploadType: string
  extension: string
}

/** Most compact first; Safari and recent Chrome record mp4, Firefox ogg, older Chrome webm. */
const CANDIDATES: readonly RecordingFormat[] = [
  { recorderType: "audio/mp4", uploadType: "audio/mp4", extension: "m4a" },
  { recorderType: "audio/ogg;codecs=opus", uploadType: "audio/ogg", extension: "ogg" },
  { recorderType: "audio/webm;codecs=opus", uploadType: "audio/webm", extension: "webm" },
]

/** The first recording format the browser can make, or null when it records no audio the backend reads. */
export function pickRecordingFormat(isSupported: (type: string) => boolean): RecordingFormat | null {
  return CANDIDATES.find((format) => isSupported(format.recorderType)) ?? null
}

/** Maps a failed recording or transcription to a message key under `assistant.composer.voice`. */
export type VoiceErrorKey =
  | "micDenied"
  | "noMic"
  | "rateLimited"
  | "limit"
  | "tooLarge"
  | "tooLong"
  | "format"
  | "network"
  | "failed"

export function voiceErrorKey(error: unknown): VoiceErrorKey {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "micDenied"
    if (error.name === "NotFoundError") return "noMic"
  }
  if (isApiError(error)) {
    if (error.type === "ai/limit-reached" || error.type === "ai/smart-weekly-limit") return "limit"
    if (error.status === 429 || error.type === "common/rate-limited") return "rateLimited"
    if (error.type === "ai/voice-too-large") return "tooLarge"
    if (error.type === "ai/voice-too-long") return "tooLong"
    if (error.type === "ai/voice-format") return "format"
  }
  if (isNetworkError(error)) return "network"
  return "failed"
}

/** The loudness of one frame of time-domain samples (bytes around 128 is silence), 0 to 1 as an RMS. */
export function levelFromBytes(samples: Uint8Array): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (const sample of samples) {
    const centred = (sample - 128) / 128
    sum += centred * centred
  }
  return Math.min(1, Math.sqrt(sum / samples.length))
}
