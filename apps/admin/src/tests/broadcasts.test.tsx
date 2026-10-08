/** ADM-11, UF-ADM-08, BOT-21: the broadcast editor and list. */
import { describe, expect, test } from "bun:test"
import { apiUrl, broadcastSent, ids, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { BroadcastEditor } from "../features/broadcasts/components/broadcast-editor"
import { BroadcastEditorPage } from "../features/broadcasts/components/broadcast-editor-page"
import { BroadcastsPage } from "../features/broadcasts/components/broadcasts-page"
import { configureTests, hrefOf, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

function audienceCount(): string {
  return screen.getByTestId("audience-count").textContent ?? ""
}

describe("broadcast audience", () => {
  test("the recipient count follows the chosen filters", async () => {
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    expect(audienceCount()).toBe("Recipients: 0")

    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    await waitUntil(() => audienceCount() === "Recipients: 42", "count for everyone")

    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    await user.click(screen.getByRole("checkbox", { name: "Teachers" }))
    await waitUntil(() => audienceCount() === "Recipients: 6", "count for teachers")

    await user.click(await screen.findByRole("checkbox", { name: "2TN2" }))
    await waitUntil(() => audienceCount() === "Recipients: 4", "count for the group")
  })

  test("the send buttons stay off until the message and audience are complete", async () => {
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    const send = screen.getByRole("button", { name: "Send now" })
    expect(send).toBeDisabled()

    setValue(screen.getByLabelText(/^Title/), "Exam week")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))

    await waitUntil(() => !(send as HTMLButtonElement).disabled, "send still disabled")
    expect(send).toBeEnabled()
  })
})

describe("sending", () => {
  test("send now saves the draft, asks for confirmation with the recipient count and sends", async () => {
    const calls: string[] = []
    let created: unknown
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts"), async ({ request }) => {
        calls.push("create")
        created = await request.json()
        return HttpResponse.json({ ...broadcastSent, id: ids.broadcast, status: "draft", stats: null })
      }),
      http.post(apiUrl("/v1/admin/broadcasts/:id/send"), () => {
        calls.push("send")
        return HttpResponse.json({ ...broadcastSent, status: "sending" })
      }),
    )
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "Exam week")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    const send = screen.getByRole("button", { name: "Send now" })
    await waitUntil(() => !(send as HTMLButtonElement).disabled, "send still disabled")

    await user.click(send)

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("It goes to 42 recipients and cannot be recalled.")).toBeInTheDocument()
    expect(calls).toEqual([])

    await user.click(within(dialog).getByRole("button", { name: "Send now" }))
    await waitUntil(() => calls.length === 2, "draft saved and sent")
    expect(calls).toEqual(["create", "send"])
    expect(created).toMatchObject({ title: "Exam week", text: "Exams start on Monday.", audience: { everyone: true } })
    await waitUntil(() => testRouter.push.mock.calls.length > 0, "no redirect")
    expect(testRouter.push).toHaveBeenCalledWith("/broadcasts/")
  })

  test("the preview goes to my Telegram after saving the draft", async () => {
    let previewed = false
    server.use(
      http.post(apiUrl("/v1/admin/broadcasts"), () =>
        HttpResponse.json({ ...broadcastSent, id: ids.broadcast, status: "draft", stats: null }),
      ),
      http.post(apiUrl("/v1/admin/broadcasts/:id/preview"), () => {
        previewed = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    setValue(screen.getByLabelText(/^Title/), "Exam week")
    setValue(screen.getByLabelText(/^Text/), "Exams start on Monday.")
    await user.click(screen.getByRole("checkbox", { name: "Everyone" }))
    const preview = screen.getByRole("button", { name: "Send preview to me" })
    await waitUntil(() => !(preview as HTMLButtonElement).disabled, "preview still disabled")

    await user.click(preview)

    await waitUntil(() => previewed, "no preview request")
  })
})

describe("formatting toolbar", () => {
  test("bold wraps the selected text in tags", async () => {
    const { user } = renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    const text = screen.getByLabelText(/^Text/) as HTMLTextAreaElement
    setValue(text, "Hello world")
    text.setSelectionRange(0, 5)

    await user.click(screen.getByRole("button", { name: "Bold" }))

    expect(text.value).toBe("<b>Hello</b> world")
    expect(screen.getByTestId("broadcast-preview").querySelector("strong")?.textContent).toBe("Hello")
  })

  test("the preview never renders scripts or unsafe links", () => {
    renderAdmin(<BroadcastEditor item={null} />, { route: "/broadcasts/edit/" })
    const text = screen.getByLabelText(/^Text/)

    fireEvent.change(text, {
      target: { value: '<script>alert(1)</script><a href="javascript:alert(1)">x</a><a href="https://ihsu.uz">ok</a>' },
    })

    const preview = screen.getByTestId("broadcast-preview")
    expect(preview.querySelector("script")).toBeNull()
    expect(preview.querySelectorAll("a")).toHaveLength(1)
    expect(preview.querySelector("a")?.getAttribute("href")).toBe("https://ihsu.uz")
  })
})

describe("existing broadcasts", () => {
  test("a sent broadcast is read-only and shows the delivery counts", async () => {
    renderAdmin(<BroadcastEditorPage />, { route: `/broadcasts/edit/?id=${broadcastSent.id}` })

    expect(await screen.findByText("This broadcast can no longer be edited.")).toBeInTheDocument()
    const stats = screen.getByTestId("broadcast-stats")
    expect(within(stats).getByText("39")).toBeInTheDocument()
    expect(within(stats).getByText("Blocked the bot")).toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Send now" })).not.toBeInTheDocument()
  })

  test("the list links each broadcast to its editor", async () => {
    renderAdmin(<BroadcastsPage />, { route: "/broadcasts/" })

    const link = await screen.findByRole("link", { name: "Autumn break schedule" })
    expect(hrefOf(link)).toBe(`/broadcasts/edit/?id=${broadcastSent.id}`)
    expect(screen.getByText("Sent 39, failed 1, blocked 2")).toBeInTheDocument()
  })
})
