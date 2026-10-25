import { afterEach, describe, expect, it } from "bun:test"
import type { NotebookDetail, SubjectDetail } from "@ihsp/api"
import { apiUrl, notebookDetail, notebookTurn, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders } from "../test-support"
import { leaveChatAttachment, takeChatAttachments, toSendOptions } from "./chat-attachments"
import { chatUrl, enter, renderChat } from "./chat-test-support"

allowSlowRenders()

const SUBJECT_ID = "subject-bio"
const subjectNotebook: NotebookDetail = {
  ...notebookDetail,
  origin: "subject_auto",
  subject_id: SUBJECT_ID,
  auto: { excluded_refs: [], include_classmates: false, synced_at: null },
}

const lesson = (id: string, date: string, topic: string) => ({
  id,
  date,
  topic,
  subject: { id: SUBJECT_ID, name: "Biology", short_name: "Bio" },
})

const material = (linkId: string, lessonId: string, title: string) => ({
  link_id: linkId,
  lesson_id: lessonId,
  role: "material",
  kind: "file",
  title,
  hidden: false,
  short_url: "https://s.test/x",
  file: null,
  created_at: "2026-10-05T05:00:00Z",
  author: { id: "t1", first_name: "A", last_name: "B" },
  source: "user",
})

const detail = {
  subject: { id: SUBJECT_ID, name: "Biology", short_name: "Bio" },
  lessons: [lesson("lesson-cells", "2026-10-05", "Cells"), lesson("lesson-light", "2026-10-12", "Photosynthesis")],
  materials: [
    material("link-slides", "lesson-light", "Light slides"),
    material("link-quiz", "lesson-cells", "Cell quiz"),
  ],
} as unknown as SubjectDetail

/** The subject of the notebook and a recorder of every chat body. */
function serveSubject() {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.get(apiUrl(`/v1/me/subjects/${SUBJECT_ID}`), () => HttpResponse.json(detail)),
    http.post(chatUrl("/messages"), async ({ request }) => {
      const body = (await request.json()) as { text: string }
      bodies.push(body)
      return HttpResponse.json(notebookTurn(body.text))
    }),
  )
  return bodies
}

afterEach(() => window.sessionStorage.clear())

describe("chat attachments helpers", () => {
  it("leaves an attachment for the chat and takes it once", () => {
    leaveChatAttachment("nb-1", {
      kind: "lesson",
      key: "lesson:l1",
      label: "12 Oct · Cells",
      attachment: { kind: "lesson", id: "l1" },
    })

    expect(takeChatAttachments("nb-1").map((item) => item.label)).toEqual(["12 Oct · Cells"])
    expect(takeChatAttachments("nb-1")).toEqual([])
  })

  it("ignores a broken stored value", () => {
    window.sessionStorage.setItem("ihsp.notebooks.attach.nb-1", "{nope")
    expect(takeChatAttachments("nb-1")).toEqual([])
  })

  it("turns chips into attachments and source ids", () => {
    expect(
      toSendOptions([
        { kind: "lesson", key: "a", label: "A", attachment: { kind: "lesson", id: "l1" } },
        { kind: "file", key: "b", label: "B", sourceId: "s1" },
      ]),
    ).toEqual({ attachments: [{ kind: "lesson", id: "l1" }], sourceIds: ["s1"] })
    expect(toSendOptions([])).toEqual({})
  })
})

describe("NotebookComposer: attachments", () => {
  it("opens with the lesson left by Ask AI as a chip and sends it with the question", async () => {
    const bodies = serveSubject()
    leaveChatAttachment(subjectNotebook.id, {
      kind: "lesson",
      key: "lesson:lesson-light",
      label: "12 October · Photosynthesis",
      attachment: { kind: "lesson", id: "lesson-light" },
    })
    const { user } = await renderChat({ notebook: subjectNotebook })

    expect(await screen.findByText("12 October · Photosynthesis")).toBeInTheDocument()
    await enter(user, "Explain it")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ text: "Explain it", attachments: [{ kind: "lesson", id: "lesson-light" }] })
    expect(screen.queryByText("12 October · Photosynthesis")).not.toBeInTheDocument()
  })

  it("removes a chip with its close button", async () => {
    serveSubject()
    leaveChatAttachment(subjectNotebook.id, {
      kind: "lesson",
      key: "lesson:lesson-light",
      label: "Photosynthesis",
      attachment: { kind: "lesson", id: "lesson-light" },
    })
    const { user } = await renderChat({ notebook: subjectNotebook })

    await user.click(await screen.findByRole("button", { name: "Remove Photosynthesis" }))

    expect(screen.queryByText("Photosynthesis", { selector: "span" })).not.toBeInTheDocument()
  })

  it("adds a lesson found by search from the (+) menu", async () => {
    const bodies = serveSubject()
    const { user } = await renderChat({ notebook: subjectNotebook })

    await user.click(screen.getByRole("button", { name: "Add to the question" }))
    await user.click(await screen.findByRole("menuitem", { name: "Add lesson" }))
    const dialog = await screen.findByRole("dialog", { name: "Add lesson" })
    await user.type(within(dialog).getByRole("searchbox"), "cell")
    expect(within(dialog).queryByText(/Photosynthesis/)).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: /Cells/ }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await enter(user, "Summarise")
    await user.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ attachments: [{ kind: "lesson", id: "lesson-cells" }] })
  })

  it("attaches a subject material found by search", async () => {
    const bodies = serveSubject()
    const { user } = await renderChat({ notebook: subjectNotebook })

    await user.click(screen.getByRole("button", { name: "Add to the question" }))
    await user.click(await screen.findByRole("menuitem", { name: "Search materials" }))
    const dialog = await screen.findByRole("dialog", { name: "Search materials" })
    await user.type(within(dialog).getByRole("searchbox"), "slides")
    await user.click(within(dialog).getByRole("button", { name: /Light slides/ }))

    await enter(user, "What is on the slides?")
    await user.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      attachments: [{ kind: "material", id: "link-slides", lesson_id: "lesson-light" }],
    })
  })

  it("offers upload in a subject notebook too and no lesson items without a subject", async () => {
    serveSubject()
    const auto = await renderChat({ notebook: subjectNotebook })
    await auto.user.click(screen.getByRole("button", { name: "Add to the question" }))
    expect(await screen.findByRole("menuitem", { name: "Add lesson" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Upload files" })).toBeInTheDocument()
    auto.unmount()

    const own = await renderChat()
    await own.user.click(screen.getByRole("button", { name: "Add to the question" }))
    expect(await screen.findByRole("menuitem", { name: "Upload files" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Add lesson" })).not.toBeInTheDocument()
  })
})
