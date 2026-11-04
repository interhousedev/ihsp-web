import { api } from "@ihsp/api"

/** One finished recording: its bytes, the MIME type it was recorded as and the length the browser measured. */
export type VoiceClip = {
  blob: Blob
  durationMs: number
  /** The base MIME type (no codecs): the backend picks the audio format from it. */
  type: string
  extension: string
}

// TODO(contract): replace with the generated type once openapi.json lists POST /v1/ai/transcriptions.
type TranscriptionResponse = { text: string }

/**
 * Speech to text for the composer: `POST /v1/ai/transcriptions` (multipart: `file`, `duration_ms`). The audio is not
 * stored. Failures are `ApiError`s (rate limit, budget, format, length); the composer maps them to messages.
 */
export async function transcribeVoice(clip: VoiceClip, signal?: AbortSignal): Promise<string> {
  const form = new FormData()
  form.append("file", new File([clip.blob], `voice.${clip.extension}`, { type: clip.type }))
  form.append("duration_ms", String(Math.round(clip.durationMs)))
  const result = await api.request<TranscriptionResponse>({
    method: "POST",
    path: "/v1/ai/transcriptions",
    formData: form,
    signal,
  })
  return result.text.trim()
}
