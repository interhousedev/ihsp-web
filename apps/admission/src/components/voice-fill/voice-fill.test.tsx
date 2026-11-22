import { apiUrl, server } from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { VoiceFill } from "./voice-fill"

const messages = {
  voiceFill: {
    talk: "Talk in voice",
    title: "Answer aloud",
    stop: "Pause the microphone",
    resume: "Start the microphone",
    listening: "Listening…",
    paused: "Paused",
    placeholder: "Your words will appear here",
    typedLabel: "Your answer",
    typedHint: "Type",
    done: "Fill the form",
    filling: "Filling…",
    cancel: "Back to the form",
    error: "Could not fill",
  },
}

type Result = { isFinal: boolean; 0: { transcript: string }; length: 1 }
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ""
  continuous = false
  interimResults = false
  onresult: ((e: { resultIndex: number; results: Result[] }) => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    FakeRecognition.last = this
  }
  start() {}
  stop() {
    this.onend?.()
  }
  say(transcript: string, isFinal: boolean) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript }, length: 1 }] })
  }
}

const w = window as unknown as { SpeechRecognition?: typeof FakeRecognition }

afterEach(() => {
  delete w.SpeechRecognition
  FakeRecognition.last = null
})

function Host({ onFill }: { onFill: (v: Record<string, string>) => void }) {
  return (
    <VoiceFill form="t" questions={["What do you like?"]} fields={[{ key: "likes", label: "Likes" }]} onFill={onFill}>
      <input aria-label="likes-field" />
    </VoiceFill>
  )
}

describe("VoiceFill", () => {
  test("speech: collapses the form, shows live text, posts it and returns the values", async () => {
    w.SpeechRecognition = FakeRecognition
    let body: { transcript: string; form: string; fields: { key: string }[] } | null = null
    server.use(
      http.post(apiUrl("/v1/admission/voice-fill"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({ values: { likes: "chess" } })
      }),
    )
    const filled: Record<string, string>[] = []
    renderAdmissionApp(<Host onFill={(v) => filled.push(v)} />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Talk in voice" }))
    expect(screen.queryByLabelText("likes-field")).toBeNull()
    expect(screen.getByText("What do you like?")).toBeTruthy()
    await waitFor(() => expect(FakeRecognition.last).not.toBeNull())
    expect(FakeRecognition.last?.interimResults).toBe(true)
    act(() => FakeRecognition.last?.say("I like", false))
    expect(screen.getByTestId("voice-transcript").textContent).toBe("I like")
    act(() => FakeRecognition.last?.say("I like chess", true))
    fireEvent.click(screen.getByRole("button", { name: "Fill the form" }))
    await waitFor(() => expect(filled).toEqual([{ likes: "chess" }]))
    expect(body!.transcript).toBe("I like chess")
    expect(body!.form).toBe("t")
    expect(body!.fields[0]!.key).toBe("likes")
    expect(await screen.findByLabelText("likes-field")).toBeTruthy()
  })

  test("without Web Speech a typed textarea carries the transcript", async () => {
    server.use(http.post(apiUrl("/v1/admission/voice-fill"), () => HttpResponse.json({ values: { likes: "x" } })))
    const filled: Record<string, string>[] = []
    renderAdmissionApp(<Host onFill={(v) => filled.push(v)} />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Talk in voice" }))
    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "typed words" } })
    fireEvent.click(screen.getByRole("button", { name: "Fill the form" }))
    await waitFor(() => expect(filled).toEqual([{ likes: "x" }]))
  })

  test("a failed fill keeps voice mode and shows an error", async () => {
    server.use(http.post(apiUrl("/v1/admission/voice-fill"), () => HttpResponse.json({ title: "x" }, { status: 500 })))
    renderAdmissionApp(<Host onFill={() => {}} />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Talk in voice" }))
    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "words" } })
    fireEvent.click(screen.getByRole("button", { name: "Fill the form" }))
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByTestId("voice-fill-mode")).toBeTruthy()
  })
})
