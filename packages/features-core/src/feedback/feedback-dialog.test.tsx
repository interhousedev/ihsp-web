import { describe, expect, it, mock, setDefaultTimeout } from "bun:test"
import type { FeedbackCreateBody } from "@ihsp/api"
import { apiUrl, problem, renderWithProviders, server } from "@ihsp/test-utils"
import { configure, fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { FeedbackDialog } from "./feedback-dialog"

configure({ asyncUtilTimeout: 8000 })
setDefaultTimeout(30_000)

function renderDialog(defaultArea: "my" | "staff" = "my") {
  const onOpenChange = mock((_open: boolean) => undefined)
  const result = renderWithProviders(<FeedbackDialog open onOpenChange={onOpenChange} defaultArea={defaultArea} />, {
    route: "/",
  })
  return { ...result, onOpenChange }
}

/** Records the body of the next `POST /v1/feedback` so a test can check what the form sent. */
function recordSubmissions(): FeedbackCreateBody[] {
  const sent: FeedbackCreateBody[] = []
  server.use(
    http.post(apiUrl("/v1/feedback"), async ({ request }) => {
      const body = (await request.json()) as FeedbackCreateBody
      sent.push(body)
      return HttpResponse.json(
        {
          id: "7b1c0000-0000-4000-8000-0000000000aa",
          kind: body.kind,
          area: body.area,
          title: body.title,
          description: body.description,
          status: "new",
          source: "web",
          created_at: "2026-10-25T10:00:00+05:00",
          attachments: [],
          response_count: 0,
        },
        { status: 201 },
      )
    }),
  )
  return sent
}

function fillTitleAndDetails(title: string, details: string) {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: title } })
  fireEvent.change(screen.getByLabelText("Details"), { target: { value: details } })
}

function pngFile(name: string) {
  return new File(["png-bytes"], name, { type: "image/png" })
}

describe("FeedbackDialog", () => {
  it("preselects the section the app passes and sends the report with the page address", async () => {
    const sent = recordSubmissions()
    const { user } = renderDialog("my")
    expect(screen.getByRole("combobox", { name: "Section" })).toHaveTextContent("my.iht")

    await user.type(screen.getByLabelText("Title"), "Schedule is blank")
    await user.type(screen.getByLabelText("Details"), "The timetable page is empty on my phone.")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]).toMatchObject({
      kind: "bug",
      area: "my",
      title: "Schedule is blank",
      description: "The timetable page is empty on my phone.",
      attachment_file_ids: [],
      page_url: "http://localhost:3000/",
    })
    expect(await screen.findByText("Thank you. We received your message.")).toBeInTheDocument()
  })

  it("sends the page address without its query and hash", async () => {
    const sent = recordSubmissions()
    const { user } = renderDialog()
    window.history.replaceState({}, "", "/timetable/?code=oauth-code&id=42#access_token=secret")
    await user.type(screen.getByLabelText("Title"), "Query test")
    await user.type(screen.getByLabelText("Details"), "Check the address.")

    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]?.page_url).toBe("http://localhost:3000/timetable/")
    window.history.replaceState({}, "", "/")
  })

  it("keeps sending disabled until the title and the details have text", async () => {
    recordSubmissions()
    const { user } = renderDialog()
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toBeDisabled()

    await user.type(screen.getByLabelText("Title"), "Idea")
    expect(send).toBeDisabled()

    await user.type(screen.getByLabelText("Details"), "Make it faster")
    expect(send).toBeEnabled()
  })

  it("sends the chosen kind and section instead of the defaults", async () => {
    const sent = recordSubmissions()
    const { user } = renderDialog("my")

    await user.click(screen.getByRole("combobox", { name: "Section" }))
    await user.click(await screen.findByRole("option", { name: "Library" }))
    await user.click(screen.getByRole("combobox", { name: "Type" }))
    await user.click(await screen.findByRole("option", { name: "Idea" }))
    fillTitleAndDetails("Bigger covers", "Book covers are too small.")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]).toMatchObject({ kind: "idea", area: "library" })
  })

  it("shows the rate limit message when the backend refuses more reports", async () => {
    server.use(
      http.post(apiUrl("/v1/feedback"), () =>
        problem(429, "feedback/rate-limited", "Too many requests", { messageKey: "feedback-rate-limited" }),
      ),
    )
    const { user } = renderDialog()
    fillTitleAndDetails("Another one", "Still broken.")

    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("You have sent too many messages. Try again later.")
  })

  it("attaches an image with a preview and sends its file id once the upload is verified", async () => {
    const sent = recordSubmissions()
    renderDialog()
    fillTitleAndDetails("Screenshot", "See the picture.")

    fireEvent.change(screen.getByLabelText("Choose files"), { target: { files: [pngFile("screen.png")] } })

    expect(await screen.findByRole("img", { name: "screen.png" })).toBeInTheDocument()
    const send = screen.getByRole("button", { name: "Send" })
    await waitFor(() => expect(send).toBeEnabled())
    fireEvent.click(send)

    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]?.attachment_file_ids).toHaveLength(1)
  })

  it("accepts at most ten images and says so for the eleventh", async () => {
    recordSubmissions()
    renderDialog()
    const files = Array.from({ length: 11 }, (_, index) => pngFile(`shot-${index}.png`))

    fireEvent.change(screen.getByLabelText("Choose files"), { target: { files } })

    expect(await screen.findByRole("alert")).toHaveTextContent("You can attach up to 10 files.")
    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(10))
  })

  it("refuses a file that is not an image", async () => {
    recordSubmissions()
    renderDialog()

    fireEvent.change(screen.getByLabelText("Choose files"), {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Only images can be attached.")
    expect(screen.queryAllByRole("img")).toHaveLength(0)
  })
})
