/** ADM-11: the broadcast editor saves trimmed drafts, patches existing ones, and reports API errors. */
import { describe, expect, spyOn, test } from "bun:test"
import {
  apiUrl,
  audienceEveryone,
  broadcastDraft,
  broadcastScheduled,
  broadcastSent,
  ids,
  server,
  testRouter,
} from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { BroadcastEditor } from "../features/broadcasts/components/broadcast-editor"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("broadcast editor validation", () => {
  test("a blank title or text keeps every action off", async () => {
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "   ")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))

    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send preview to me" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send now" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled()
  })

  test("without an audience the draft cannot be saved", () => {
    renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "Exam week")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")

    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled()
  })
})

describe("saving", () => {
  test("a new draft is sent trimmed and the editor moves to its address", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...broadcastDraft, id: ids.broadcast })
      }),
    )
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "  Exam week  ")
    setValue(screen.getByLabelText(/^Text/), "  Exams start on Monday.  ")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    const save = screen.getByRole("button", { name: "Save draft" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")

    await user.click(save)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({
      title: "Exam week",
      text: "Exams start on Monday.",
      media_file_ids: [],
      audience: audienceEveryone,
    })
    await waitUntil(() => testRouter.replace.mock.calls.length > 0, "no redirect")
    expect(testRouter.replace).toHaveBeenCalledWith(`/broadcasts/edit/?id=${ids.broadcast}`)
  })

  test("an existing draft is patched, not created again", async () => {
    let patched: unknown
    let created = false
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts"), () => {
        created = true
        return HttpResponse.json(broadcastDraft)
      }),
      http.patch(apiUrl("/v1/admin/broadcasts/:id"), async ({ request }) => {
        patched = await request.json()
        return HttpResponse.json(broadcastDraft)
      }),
    )
    const { user } = renderAdmin(<BroadcastEditor item={broadcastDraft} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "Midterm schedule v2")

    await user.click(screen.getByRole("button", { name: "Save draft" }))

    await waitUntil(() => patched !== undefined, "no patch")
    expect(patched).toMatchObject({ title: "Midterm schedule v2", audience: broadcastDraft.audience })
    expect(created).toBe(false)
    expect(testRouter.replace).not.toHaveBeenCalled()
  })

  test("a server error is shown as a toast and the editor stays put", async () => {
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts"), () =>
        HttpResponse.json(
          { type: "common/internal", title: "Server error", status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const error = spyOn(toast, "error").mockImplementation(() => "")
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "Exam week")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    const save = screen.getByRole("button", { name: "Save draft" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")

    await user.click(save)

    await waitUntil(() => error.mock.calls.length > 0, "no error toast")
    expect(testRouter.replace).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Title/)).toHaveValue("Exam week")
    error.mockRestore()
  })
})

describe("existing broadcasts", () => {
  test("a scheduled broadcast can be rescheduled or cancelled", async () => {
    let cancelled = false
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts/:id/cancel"), () => {
        cancelled = true
        return HttpResponse.json({ ...broadcastScheduled, status: "cancelled" })
      }),
    )
    const { user } = renderAdmin(<BroadcastEditor item={broadcastScheduled} />, { route: "/broadcasts/edit/" })
    expect(screen.getByRole("button", { name: "Change time" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel sending" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(cancelled).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Cancel sending" }))

    await waitUntil(() => cancelled, "no cancel request")
  })

  test("a sent broadcast is read-only: no save or schedule buttons, title disabled", () => {
    renderAdmin(<BroadcastEditor item={broadcastSent} />, { route: "/broadcasts/edit/" })

    expect(screen.getByText("This broadcast can no longer be edited.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull()
    expect(screen.getByLabelText(/^Title/)).toBeDisabled()
  })

  test("an attached file can be removed and the rest is saved", async () => {
    let patched: { media_file_ids?: string[] } | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/broadcasts/:id"), async ({ request }) => {
        patched = (await request.json()) as { media_file_ids?: string[] }
        return HttpResponse.json(broadcastDraft)
      }),
    )
    const item = { ...broadcastDraft, media_file_ids: ["file-a", "file-b"] }
    const { user } = renderAdmin(<BroadcastEditor item={item} />, { route: "/broadcasts/edit/" })

    await user.click(screen.getByRole("button", { name: "Remove #1" }))
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    await waitUntil(() => patched !== undefined, "no patch")
    expect(patched?.media_file_ids).toEqual(["file-b"])
  })
})
