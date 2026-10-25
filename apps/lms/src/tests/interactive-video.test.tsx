import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { LearningInteractiveVideoBlock } from "@ihsp/api"
import { apiUrl, server } from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { http } from "msw"
import { useState } from "react"
import { InteractiveVideoBlock } from "../features/player/components/interactive-video-block"
import {
  dueInteraction,
  embedUrl,
  formatTime,
  parseTime,
  sortInteractions,
  videoSource,
} from "../features/player/utils/interactive-video"
import { InteractiveVideoBlockEditor } from "../features/step-editor/components/interactive-video-block-editor"
import {
  newInteractiveVideoBlock,
  remapIds,
  validateContent,
  type InteractiveVideoBlock as AuthorBlock,
} from "../features/step-editor/utils/content-ops"
import { readBody, renderLms } from "./helpers"

setDefaultTimeout(60_000)

const question = {
  id: "q1",
  at_sec: 10,
  kind: "question" as const,
  text: "Which one?",
  url: "",
  multiple: false,
  points: 1,
  options: [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ],
}
const note = { ...question, id: "n1", at_sec: 4, kind: "note" as const, text: "Look here", options: [] }

function learnerBlock(url: string, extra: Partial<LearningInteractiveVideoBlock> = {}): LearningInteractiveVideoBlock {
  return {
    id: "iv",
    type: "interactive_video",
    source: "link",
    url,
    file_id: null,
    caption: "",
    interactions: [question, note],
    passed: false,
    ...extra,
  }
}

describe("interactive video model", () => {
  it("sorts pauses and stops at the first one crossed, never on a backward seek", () => {
    const sorted = sortInteractions([question, note])
    expect(sorted.map((item) => item.id)).toEqual(["n1", "q1"])
    expect(dueInteraction(sorted, 0, 3, new Set())).toBeNull()
    expect(dueInteraction(sorted, 3, 4.2, new Set())?.id).toBe("n1")
    // a jump forward past both pauses stops at the first one not done
    expect(dueInteraction(sorted, 0, 50, new Set(["n1"]))?.id).toBe("q1")
    expect(dueInteraction(sorted, 50, 5, new Set())).toBeNull()
  })

  it("parses and formats times", () => {
    expect(parseTime("1:30")).toBe(90)
    expect(parseTime("1:02:03")).toBe(3723)
    expect(parseTime("45")).toBe(45)
    expect(parseTime("x")).toBeNull()
    expect(formatTime(3723)).toBe("1:02:03")
    expect(formatTime(65)).toBe("1:05")
  })

  it("recognises YouTube, Vimeo and direct files and turns the JS API on", () => {
    expect(videoSource("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" })
    expect(videoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" })
    expect(videoSource("https://vimeo.com/76979871")).toEqual({ kind: "vimeo", id: "76979871" })
    expect(videoSource("https://cdn.test/a.mp4")).toEqual({ kind: "file", src: "https://cdn.test/a.mp4" })
    expect(videoSource("javascript:alert(1)")).toEqual({ kind: "none" })
    expect(embedUrl({ kind: "youtube", id: "abc123" }, "https://lms.test")).toContain("enablejsapi=1")
  })

  it("maps the server ids of pauses and options back by position, and checks the pauses", () => {
    const block: AuthorBlock = {
      ...newInteractiveVideoBlock(),
      url: "https://youtu.be/dQw4w9WgXcQ",
      interactions: [
        {
          id: "tmp-1",
          at_sec: 5,
          kind: "question",
          text: "",
          options: [{ id: "tmp-o", text: "", correct: true, pinned: false }],
          multiple: false,
          url: "",
          points: 1,
        },
      ],
    }
    const local = { title: "t", blocks: [block] }
    const returned = {
      title: "t",
      blocks: [
        {
          ...block,
          id: "B",
          interactions: [
            { ...block.interactions[0]!, id: "I", options: [{ ...block.interactions[0]!.options[0]!, id: "O" }] },
          ],
        },
      ],
    }
    const { content } = remapIds(local, local, returned)
    const mapped = content.blocks[0] as AuthorBlock
    expect(mapped.interactions[0]?.id).toBe("I")
    expect(mapped.interactions[0]?.options[0]?.id).toBe("O")
    expect(validateContent(local).map((issue) => issue.code)).toEqual([
      "empty-prompt",
      "too-few-options",
      "empty-option",
    ])
  })
})

function Editor() {
  const [block, setBlock] = useState<AuthorBlock>({
    ...newInteractiveVideoBlock(),
    url: "https://youtu.be/x1y2z3a4b5c",
  })
  return (
    <>
      <InteractiveVideoBlockEditor block={block} onChange={setBlock} courseId="c1" stepId="s1" />
      <output data-testid="block">{JSON.stringify(block)}</output>
    </>
  )
}

const current = () => JSON.parse(screen.getByTestId("block").textContent ?? "{}") as AuthorBlock

describe("interactive video editor", () => {
  it("adds a question at the typed time with two options and a note", async () => {
    const { user } = renderLms(<Editor />)
    const at = screen.getAllByLabelText("Time")[0]!
    await user.clear(at)
    await user.type(at, "1:30")
    await user.click(screen.getByRole("button", { name: "Question" }))
    await user.click(screen.getByRole("button", { name: "Note" }))

    const interactions = current().interactions
    expect(interactions.map((item) => [item.kind, item.at_sec, item.options.length])).toEqual([
      ["question", 90, 2],
      ["note", 90, 0],
    ])
    await user.type(screen.getAllByLabelText("Question")[0]!, "Why?")
    expect(current().interactions[0]?.text).toBe("Why?")
    await user.click(screen.getAllByRole("button", { name: "Remove the pause at 1:30" })[0]!)
    expect(current().interactions).toHaveLength(1)
  })
})

describe("interactive video player", () => {
  it("pauses a direct file at the question, grades the answer and goes on", async () => {
    let sent: unknown
    server.use(
      http.post(
        apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/interactions/:interactionId/answer"),
        async ({ request }) => {
          sent = await readBody(request)
          return Response.json({
            answer: { option_ids: ["a"], correct: true },
            correct_option_ids: ["a"],
            result: { score: 1, max_score: 1, completed: true },
          })
        },
      ),
    )
    const { user, container } = renderLms(
      <InteractiveVideoBlock
        block={learnerBlock("https://cdn.test/a.mp4")}
        courseId="c1"
        stepId="s1"
        preview={false}
      />,
    )
    const video = container.querySelector("video")!
    let paused = 0
    video.pause = () => {
      paused += 1
    }
    video.play = () => Promise.resolve()

    const at = (seconds: number) =>
      act(() => {
        Object.defineProperty(video, "currentTime", { value: seconds, configurable: true })
        fireEvent.timeUpdate(video)
      })

    at(11)
    // a jump past both pauses stops at the note of 0:04 first, then at the question of 0:10
    expect(await screen.findByText("Look here")).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "Continue" }))
    at(11.2)
    expect(await screen.findByText("Which one?", { selector: "p" })).toBeTruthy()
    expect(paused).toBe(2)

    await user.click(screen.getByLabelText("Alpha"))
    await user.click(screen.getByRole("button", { name: "Answer" }))
    expect(await screen.findByText("Correct!")).toBeTruthy()
    expect(sent).toEqual({ option_ids: ["a"] })
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await waitFor(() => expect(screen.queryByText("Correct!")).toBeNull())
  })

  it("drives a YouTube embed by postMessage: listens for the time, sends pauseVideo", async () => {
    server.use(
      http.get(
        "https://www.youtube-nocookie.com/*",
        () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }),
      ),
      http.get("http://localhost/", () => new Response("")),
    )
    const { container } = renderLms(
      <InteractiveVideoBlock block={learnerBlock("https://youtu.be/dQw4w9WgXcQ")} courseId="c1" stepId="s1" preview />,
    )
    const frame = container.querySelector("iframe")!
    expect(frame.src).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ")
    expect(frame.src).toContain("enablejsapi=1")
    const posted: string[] = []
    Object.defineProperty(frame, "contentWindow", {
      value: { postMessage: (message: string) => posted.push(message) },
      configurable: true,
    })
    const source = frame.contentWindow as unknown as MessageEventSource

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://www.youtube-nocookie.com",
          source,
          data: JSON.stringify({ event: "infoDelivery", info: { currentTime: 5 } }),
        }),
      )
    })
    expect(await screen.findByText("Look here")).toBeTruthy()
    expect(posted.some((message) => message.includes("pauseVideo"))).toBe(true)

    // a message from another origin is ignored
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.test",
          source,
          data: JSON.stringify({ event: "infoDelivery", info: { currentTime: 50 } }),
        }),
      )
    })
    expect(screen.queryByText("Which one?", { selector: "p" })).toBeNull()
  })
})
