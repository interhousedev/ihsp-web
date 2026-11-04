import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import type { FileItem } from "@ihsp/api"
import { apiUrl, problem, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import type { LimitState } from "./limit-info"
import type { ComponentProps } from "react"
import { ComposerVoiceBar } from "./composer-voice"
import { PillComposer, type PillSendOptions } from "./pill-composer"
import { WAVE_BARS } from "./voice-format"

allowSlowRenders()

const loose = userEvent.setup({ pointerEventsCheck: 0 })

/** A stand-in for MediaRecorder: records what the composer asked for and emits one chunk on stop. */
class FakeRecorder {
  static instances: FakeRecorder[] = []
  static supported = new Set(["audio/mp4"])
  static isTypeSupported(type: string) {
    return FakeRecorder.supported.has(type)
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

let trackStops: ReturnType<typeof mock>
let getUserMedia: ReturnType<typeof mock>

function installMicrophone(denied = false) {
  trackStops = mock(() => undefined)
  const stream = { getTracks: () => [{ stop: trackStops }] } as unknown as MediaStream
  getUserMedia = denied
    ? mock(async () => {
        throw new DOMException("Permission denied", "NotAllowedError")
      })
    : mock(async () => stream)
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
  Object.defineProperty(globalThis, "MediaRecorder", { value: FakeRecorder, configurable: true })
}

beforeEach(() => {
  FakeRecorder.instances = []
  installMicrophone()
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, "MediaRecorder")
  Reflect.deleteProperty(navigator, "mediaDevices")
})

function renderComposer() {
  const onSend = mock(async (_text: string, _files: FileItem[], _options?: PillSendOptions) => true)
  const limit: LimitState = { reached: false }
  const result = renderNotebook(<PillComposer sending={false} limit={limit} onSend={onSend} placeholder="Ask" />, {
    route: "/assistant/",
  })
  return { ...result, onSend }
}

const transcription = (text: string) =>
  server.use(http.post(apiUrl("/v1/ai/transcriptions"), () => HttpResponse.json({ text })))

describe("PillComposer voice input", () => {
  it("has no microphone button where MediaRecorder is missing (the Telegram webview)", () => {
    Reflect.deleteProperty(globalThis, "MediaRecorder")
    renderComposer()
    expect(screen.queryByRole("button", { name: "Voice message" })).toBeNull()
  })

  it("records with a live waveform; cancel drops the recording and keeps the draft", async () => {
    const { onSend } = renderComposer()
    const field = screen.getByRole("textbox", { name: "Message" })
    await loose.type(field, "Привет")

    await loose.click(screen.getByRole("button", { name: "Voice message" }))
    expect(await screen.findByRole("img", { name: "Recording level" })).toBeInTheDocument()

    await loose.click(screen.getByRole("button", { name: "Cancel recording" }))

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Привет")
    expect(trackStops).toHaveBeenCalled()
    expect(onSend).not.toHaveBeenCalled()
  })

  it("stop transcribes the recording into the field for editing and does not send it", async () => {
    transcription("Какие у меня оценки?")
    const { onSend } = renderComposer()

    await loose.click(screen.getByRole("button", { name: "Voice message" }))
    await loose.click(await screen.findByRole("button", { name: "Stop recording" }))

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Какие у меня оценки?"))
    expect(onSend).not.toHaveBeenCalled()
    expect(FakeRecorder.instances[0]?.options).toEqual({ mimeType: "audio/mp4", audioBitsPerSecond: 16000 })
  })

  it("stop and send sends the transcript as the message", async () => {
    transcription("Расписание на завтра")
    const { onSend } = renderComposer()

    await loose.click(screen.getByRole("button", { name: "Voice message" }))
    await loose.click(await screen.findByRole("button", { name: "Stop and send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    expect(onSend.mock.calls[0]?.[0]).toBe("Расписание на завтра")
  })

  it("a rate-limited transcription keeps the draft and says why", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/transcriptions"), () => problem(429, "common/rate-limited", "Too many requests")),
    )
    renderComposer()
    const field = screen.getByRole("textbox", { name: "Message" })
    await loose.type(field, "Черновик")

    await loose.click(screen.getByRole("button", { name: "Voice message" }))
    await loose.click(await screen.findByRole("button", { name: "Stop recording" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many voice messages")
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Черновик")
  })

  it("a denied microphone starts no recording and says why", async () => {
    installMicrophone(true)
    renderComposer()

    await loose.click(screen.getByRole("button", { name: "Voice message" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Allow microphone access")
    expect(FakeRecorder.instances).toHaveLength(0)
  })

  it("unmounting during a recording stops the recorder and releases the microphone", async () => {
    const { unmount } = renderComposer()
    await loose.click(screen.getByRole("button", { name: "Voice message" }))
    await screen.findByRole("img", { name: "Recording level" })

    unmount()

    expect(trackStops).toHaveBeenCalled()
    expect(FakeRecorder.instances[0]?.state).toBe("inactive")
  })
})

describe("PillComposer drag and drop", () => {
  it("refuses a dropped file of a type the upload does not take, and names it", async () => {
    renderComposer()

    fireEvent.drop(screen.getByRole("textbox", { name: "Message" }), {
      dataTransfer: { files: [new File(["x"], "setup.exe")], types: ["Files"] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("setup.exe")
  })
})

function renderBar(props: Partial<ComponentProps<typeof ComposerVoiceBar>> = {}) {
  const handlers = {
    onCancel: mock(() => undefined),
    onStop: mock(() => undefined),
    onSend: mock(() => undefined),
  }
  renderNotebook(<ComposerVoiceBar phase="recording" levels={[]} {...handlers} {...props} />, { route: "/assistant/" })
  return handlers
}

function waveMarks(): HTMLElement[] {
  return Array.from(screen.getByRole("img", { name: "Recording level" }).children) as HTMLElement[]
}

describe("ComposerVoiceBar", () => {
  it("draws silence as a dotted baseline and the newest level as the rightmost bar", () => {
    renderBar({ levels: [0, 0.5, 1] })

    const marks = waveMarks()
    expect(marks).toHaveLength(WAVE_BARS)
    expect(marks[WAVE_BARS - 3]?.dataset.wave).toBe("dot")
    expect(marks[WAVE_BARS - 2]?.dataset.wave).toBe("bar")
    expect(marks[WAVE_BARS - 1]?.dataset.wave).toBe("bar")
    expect(marks[WAVE_BARS - 1]?.style.height).toBe("100%")
  })

  it("is a dotted line before any sound arrives", () => {
    renderBar({ levels: [] })

    expect(waveMarks().every((mark) => mark.dataset.wave === "dot")).toBe(true)
  })

  it("keeps the cancel and send controls, and the stop control is a filled square", () => {
    const { onCancel, onStop, onSend } = renderBar({ levels: [0.4] })

    fireEvent.click(screen.getByRole("button", { name: "Cancel recording" }))
    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }))
    fireEvent.click(screen.getByRole("button", { name: "Stop and send" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Stop recording" }).querySelector("[data-stop-square]")).not.toBeNull()
  })

  it("transcribing shows the muted status and a spinner in the stop circle; send does nothing", () => {
    const { onCancel, onSend } = renderBar({ phase: "transcribing" })

    expect(screen.getByRole("status")).toHaveTextContent("Transcribing")
    expect(screen.queryByRole("img", { name: "Recording level" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Stop recording" })).toBeNull()
    expect(screen.getByRole("button", { name: "Transcribing" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Stop and send" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel recording" }))

    expect(onSend).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
