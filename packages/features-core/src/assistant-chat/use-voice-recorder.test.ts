import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import { useVoiceRecorder } from "./use-voice-recorder"
import { WAVE_HISTORY } from "./voice-format"

/** MediaRecorder stand-in: emits one chunk on stop, like a finished recording. */
class FakeRecorder {
  static instances: FakeRecorder[] = []
  static isTypeSupported() {
    return true
  }
  state: "inactive" | "recording" = "inactive"
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(
    readonly stream: MediaStream,
    readonly options: { mimeType: string; audioBitsPerSecond?: number },
  ) {
    FakeRecorder.instances.push(this)
  }
  start() {
    this.state = "recording"
  }
  stop() {
    this.state = "inactive"
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mp4" }) })
    this.onstop?.()
  }
}

/** AudioContext stand-in whose analyser reports the byte `sample` for every frame. */
let sample = 128
let contextCloses: ReturnType<typeof mock>
class FakeAudioContext {
  createAnalyser() {
    return {
      fftSize: 0,
      getByteTimeDomainData: (samples: Uint8Array) => samples.fill(sample),
    }
  }
  createMediaStreamSource() {
    return { connect: () => undefined }
  }
  close() {
    return contextCloses()
  }
}

let trackStops: ReturnType<typeof mock>
let intervals: { callback: () => void; delay: number }[]
const realSetInterval = window.setInterval

function installMicrophone(stream: MediaStream = fakeStream()) {
  const getUserMedia = mock(async () => stream)
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
  return getUserMedia
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: trackStops }] } as unknown as MediaStream
}

beforeEach(() => {
  FakeRecorder.instances = []
  sample = 128
  trackStops = mock(() => undefined)
  contextCloses = mock(async () => undefined)
  intervals = []
  window.setInterval = ((callback: () => void, delay: number) => {
    intervals.push({ callback, delay })
    return intervals.length
  }) as typeof window.setInterval
  Object.defineProperty(globalThis, "MediaRecorder", { value: FakeRecorder, configurable: true })
  Object.defineProperty(globalThis, "AudioContext", { value: FakeAudioContext, configurable: true })
  installMicrophone()
})

afterEach(() => {
  window.setInterval = realSetInterval
  Reflect.deleteProperty(globalThis, "MediaRecorder")
  Reflect.deleteProperty(globalThis, "AudioContext")
  Reflect.deleteProperty(navigator, "mediaDevices")
})

describe("useVoiceRecorder", () => {
  it("unmounting while the microphone is still being asked for releases it and starts no recorder", async () => {
    let grant!: (stream: MediaStream) => void
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mock(() => new Promise<MediaStream>((resolve) => (grant = resolve))) },
      configurable: true,
    })
    const { result, unmount } = renderHook(() => useVoiceRecorder())

    let started!: Promise<unknown>
    act(() => {
      started = result.current.start()
    })
    unmount()
    await act(async () => {
      grant(fakeStream())
      await started
    })

    expect(trackStops).toHaveBeenCalled()
    expect(FakeRecorder.instances).toHaveLength(0)
  })

  it("finish resolves with the clip, releases the microphone and closes the AudioContext", async () => {
    const { result } = renderHook(() => useVoiceRecorder())

    await act(async () => {
      expect(await result.current.start()).toBeNull()
    })
    expect(result.current.recording).toBe(true)

    let clip: unknown
    await act(async () => {
      clip = await result.current.finish()
    })

    expect(clip).not.toBeNull()
    expect(trackStops).toHaveBeenCalled()
    expect(contextCloses).toHaveBeenCalledTimes(1)
    expect(result.current.recording).toBe(false)
  })

  it("unmounting during a recording closes the AudioContext and stops the recorder", async () => {
    const { result, unmount } = renderHook(() => useVoiceRecorder())
    await act(async () => {
      await result.current.start()
    })

    unmount()

    expect(contextCloses).toHaveBeenCalledTimes(1)
    expect(trackStops).toHaveBeenCalled()
    expect(FakeRecorder.instances[0]?.state).toBe("inactive")
  })

  it("samples the level at 30 frames per second or fewer and keeps only the newest history", async () => {
    const { result } = renderHook(() => useVoiceRecorder())
    await act(async () => {
      await result.current.start()
    })

    const tick = intervals[0]
    expect(tick).toBeDefined()
    expect(tick?.delay).toBeGreaterThanOrEqual(33)

    for (let index = 0; index < WAVE_HISTORY + 5; index += 1) {
      sample = index === WAVE_HISTORY + 4 ? 255 : 128
      act(() => tick?.callback())
    }

    expect(result.current.levels).toHaveLength(WAVE_HISTORY)
    expect(result.current.levels.at(-1)).toBeGreaterThan(0.9)
  })
})
