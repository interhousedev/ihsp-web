import { describe, expect, it, beforeEach } from "bun:test"
import { ApiError } from "@ihsp/api"
import { apiUrl, server } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { transcribeVoice, type VoiceClip } from "./voice-transcribe"

const clip: VoiceClip = {
  blob: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mp4" }),
  durationMs: 2400,
  type: "audio/mp4",
  extension: "m4a",
}

type Seen = { file: File | null; duration: string | null }
let seen: Seen

beforeEach(() => {
  seen = { file: null, duration: null }
})

describe("transcribeVoice", () => {
  it("posts the recording as multipart with its measured duration and returns the trimmed transcript", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/transcriptions"), async ({ request }) => {
        const form = await request.formData()
        seen = { file: form.get("file") as File, duration: String(form.get("duration_ms")) }
        return HttpResponse.json({ text: "  Какие у меня оценки?  " })
      }),
    )

    const text = await transcribeVoice(clip)

    expect(text).toBe("Какие у меня оценки?")
    expect(seen.duration).toBe("2400")
    expect(seen.file?.name).toBe("voice.m4a")
    expect(seen.file?.type).toBe("audio/mp4")
  })

  it("throws the ApiError of a rate-limited request so the composer can explain it", async () => {
    server.use(
      http.post(
        apiUrl("/v1/ai/transcriptions"),
        () =>
          new HttpResponse(JSON.stringify({ type: "common/rate-limited", title: "Too many", status: 429 }), {
            status: 429,
            headers: { "Content-Type": "application/problem+json" },
          }),
      ),
    )

    const error = await transcribeVoice(clip).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).type).toBe("common/rate-limited")
  })
})
