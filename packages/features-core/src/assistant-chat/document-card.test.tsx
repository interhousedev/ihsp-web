import { describe, expect, it, spyOn } from "bun:test"
import type { ToolCallView } from "@ihsp/api"
import { apiUrl, server, staffToday, teacherMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { ToolCallView as ToolCallRow } from "./tool-call-view"

allowSlowRenders()

const FILE_ID = "0000000f-0000-4000-8000-0000000000d1"

const call: ToolCallView = {
  id: "call-doc",
  tool: "make_document",
  access: "read",
  status: "done",
  note: "Made a document",
  preview: null,
  reject_reason: null,
  expires_at: null,
  document: { file_id: FILE_ID, name: "Cells.docx", kind: "docx", size: 36_629 },
}

function renderCall(options: Parameters<typeof renderNotebook>[1] = {}) {
  return renderNotebook(
    <ToolCallRow call={call} busy={false} onApprove={() => undefined} onReject={() => undefined} />,
    options,
  )
}

describe("make_document file card", () => {
  it("shows the file with a download that opens the presigned URL", async () => {
    const open = spyOn(window, "open").mockImplementation(() => null)
    server.use(
      http.get(apiUrl(`/v1/files/${FILE_ID}/url`), () =>
        HttpResponse.json({ url: "https://files.test/Cells.docx", expires_at: "2026-10-10T10:00:00Z" }),
      ),
    )
    const { user } = renderCall()

    expect(screen.getByRole("group", { name: "Cells.docx" })).toHaveTextContent(".docx · 36 KB")
    await user.click(screen.getByRole("button", { name: "Download .docx" }))

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith("https://files.test/Cells.docx", "_blank", "noopener,noreferrer"),
    )
    expect(screen.queryByRole("button", { name: "Attach to lesson" })).not.toBeInTheDocument()
    open.mockRestore()
  })

  it("lets a teacher attach the file to one of today's lessons as a material", async () => {
    let sent: unknown
    const lesson = staffToday.lessons[0]
    if (!lesson) throw new Error("fixture has no lesson")
    server.use(
      http.post(apiUrl(`/v1/lessons/${lesson.id}/resources`), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json([])
      }),
    )
    const { user } = renderCall({ session: { user: teacherMe } })

    await user.click(await screen.findByRole("button", { name: "Attach to lesson" }))
    await user.click(await screen.findByRole("menuitem", { name: new RegExp(lesson.subject.name) }))

    await waitFor(() => expect(sent).toEqual({ role: "material", kind: "file", file_id: FILE_ID }))
  })
})
