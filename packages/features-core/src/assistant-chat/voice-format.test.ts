import { describe, expect, it } from "bun:test"
import { ApiError, networkError } from "@ihsp/api"
import { levelFromBytes, pickRecordingFormat, voiceErrorKey } from "./voice-format"

const everything = () => true
const onlyOgg = (type: string) => type.startsWith("audio/ogg")
const onlyWebm = (type: string) => type.startsWith("audio/webm")

describe("pickRecordingFormat", () => {
  it("prefers mp4 when the browser records it, then ogg, then webm", () => {
    expect(pickRecordingFormat(everything)).toEqual({
      recorderType: "audio/mp4",
      uploadType: "audio/mp4",
      extension: "m4a",
    })
  })

  it("falls back to ogg opus and strips the codec from the uploaded type", () => {
    expect(pickRecordingFormat(onlyOgg)).toEqual({
      recorderType: "audio/ogg;codecs=opus",
      uploadType: "audio/ogg",
      extension: "ogg",
    })
  })

  it("uses webm opus in Chrome, which records no mp4 or ogg", () => {
    expect(pickRecordingFormat(onlyWebm)?.uploadType).toBe("audio/webm")
  })

  it("returns null when the browser records no audio type", () => {
    expect(pickRecordingFormat(() => false)).toBeNull()
  })
})

describe("levelFromBytes", () => {
  it("is zero for silence (the byte 128 is the zero line)", () => {
    expect(levelFromBytes(new Uint8Array(64).fill(128))).toBe(0)
  })

  it("is one for a full-scale square wave", () => {
    const samples = new Uint8Array(64).map((_, index) => (index % 2 === 0 ? 255 : 1))
    expect(levelFromBytes(samples)).toBeGreaterThan(0.95)
  })

  it("grows with loudness and stays within 0..1", () => {
    const quiet = levelFromBytes(new Uint8Array(64).map((_, index) => (index % 2 ? 140 : 116)))
    const loud = levelFromBytes(new Uint8Array(64).map((_, index) => (index % 2 ? 220 : 36)))
    expect(loud).toBeGreaterThan(quiet)
    expect(loud).toBeLessThanOrEqual(1)
    expect(quiet).toBeGreaterThanOrEqual(0)
  })
})

describe("voiceErrorKey", () => {
  it("names a denied microphone", () => {
    expect(voiceErrorKey(new DOMException("denied", "NotAllowedError"))).toBe("micDenied")
  })

  it("names a missing microphone", () => {
    expect(voiceErrorKey(new DOMException("none", "NotFoundError"))).toBe("noMic")
  })

  it("maps 429 and the rate-limit type to rateLimited", () => {
    expect(voiceErrorKey(new ApiError({ type: "common/rate-limited", status: 429, title: "" }))).toBe("rateLimited")
  })

  it("maps the token budget and the smart weekly limit to limit", () => {
    expect(voiceErrorKey(new ApiError({ type: "ai/limit-reached", status: 429, title: "" }))).toBe("limit")
    expect(voiceErrorKey(new ApiError({ type: "ai/smart-weekly-limit", status: 429, title: "" }))).toBe("limit")
  })

  it("maps the recording caps and the format to their own keys", () => {
    expect(voiceErrorKey(new ApiError({ type: "ai/voice-too-large", status: 413, title: "" }))).toBe("tooLarge")
    expect(voiceErrorKey(new ApiError({ type: "ai/voice-too-long", status: 422, title: "" }))).toBe("tooLong")
    expect(voiceErrorKey(new ApiError({ type: "ai/voice-format", status: 422, title: "" }))).toBe("format")
  })

  it("maps a lost connection to network and anything else to failed", () => {
    expect(voiceErrorKey(networkError(new Error("offline")))).toBe("network")
    expect(voiceErrorKey(new Error("boom"))).toBe("failed")
  })
})
