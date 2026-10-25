/** Call for improvements (admin): the filtered, cursor-paged list; the detail with status, thread and reply form. */
import { describe, expect, test } from "bun:test"
import { apiUrl, selectDropdownOption, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CallForImprovementsPage } from "../features/call-for-improvements/components/call-for-improvements-page"
import { FeedbackDetailPage } from "../features/call-for-improvements/components/feedback-detail-page"
import { configureTests, hrefOf, renderAdmin, setValue } from "./helpers"

configureTests()

const item = {
  id: "fb-1",
  kind: "bug",
  area: "library",
  title: "Book cover does not load",
  description: "The cover of the Algebra book shows a grey box.",
  status: "new",
  source: "web",
  created_at: "2026-10-20T06:00:00Z",
  attachments: [
    {
      file_id: "file-1",
      name: "screenshot.png",
      mime: "image/png",
      size: 2048,
      download_url: "https://files.test/file-1?sig=test",
    },
  ],
  response_count: 0,
  reporter: { user_id: "user-7", display_name: "Karimova Dilnoza", roles: ["student"], group_name: "2TN2" },
}

const second = {
  ...item,
  id: "fb-2",
  kind: "idea",
  area: "notebooks",
  title: "Dark notes",
  status: "planned",
  response_count: 2,
  attachments: [],
  reporter: { user_id: "user-8", display_name: "Aliyev Ali", roles: ["teacher"], group_name: null },
}

const detail = {
  ...item,
  page_url: "https://my.ihsu.uz/library/algebra",
  responses: [
    {
      id: "resp-1",
      text: "Fixed in the next release.",
      attachments: [],
      channels: ["telegram", "mail"],
      deliveries: [
        { channel: "telegram", status: "sent" },
        { channel: "mail", status: "failed" },
      ],
      author_name: "Admin Admin",
      created_at: "2026-10-21T07:00:00Z",
    },
  ],
}

function fileUrlHandler() {
  return http.get(apiUrl("/v1/files/:fileId/url"), ({ request, params }) => {
    const disposition = new URL(request.url).searchParams.get("disposition")
    return HttpResponse.json({
      url: `https://files.test/${String(params.fileId)}?disposition=${disposition}`,
      expires_at: "2026-10-25T10:01:00Z",
    })
  })
}

describe("call for improvements list", () => {
  test("CFI-ADM-01 lists feedback with status badges and a link to the reporter", async () => {
    server.use(http.get(apiUrl("/v1/admin/feedback"), () => HttpResponse.json({ items: [item], next_cursor: null })))
    renderAdmin(<CallForImprovementsPage />, { route: "/call-for-improvements/" })

    const table = await screen.findByRole("table")
    expect(within(table).getByText("Book cover does not load")).toBeInTheDocument()
    expect(within(table).getByText("New")).toBeInTheDocument()
    const reporter = within(table).getByRole("link", { name: "Karimova Dilnoza" })
    expect(hrefOf(reporter)).toBe("/users/view/?id=user-7")
    expect(hrefOf(within(table).getByRole("link", { name: "Book cover does not load" }))).toBe(
      "/call-for-improvements/view/?id=fb-1",
    )
  })

  test("CFI-ADM-02 filters by status and kind and sends them as query parameters", async () => {
    const queries: URLSearchParams[] = []
    server.use(
      http.get(apiUrl("/v1/admin/feedback"), ({ request }) => {
        const search = new URL(request.url).searchParams
        queries.push(search)
        return HttpResponse.json({ items: search.get("status") === "planned" ? [second] : [item], next_cursor: null })
      }),
    )
    const { user } = renderAdmin(<CallForImprovementsPage />, { route: "/call-for-improvements/" })
    await screen.findByRole("table")

    await selectDropdownOption(user, screen.getByRole("combobox", { name: "Status" }), "Planned")

    expect((await screen.findAllByText("Dark notes")).length).toBeGreaterThan(0)
    expect(queries.at(-1)?.get("status")).toBe("planned")
    expect(queries.at(-1)?.get("cursor")).toBeNull()
  })

  test("CFI-ADM-03 loads the next page with the cursor from the last response", async () => {
    const cursors: Array<string | null> = []
    server.use(
      http.get(apiUrl("/v1/admin/feedback"), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor")
        cursors.push(cursor)
        return HttpResponse.json(
          cursor === null ? { items: [item], next_cursor: "c2" } : { items: [second], next_cursor: null },
        )
      }),
    )
    const { user } = renderAdmin(<CallForImprovementsPage />, { route: "/call-for-improvements/" })
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Load more" }))

    expect((await screen.findAllByText("Dark notes")).length).toBeGreaterThan(0)
    expect(cursors).toEqual([null, "c2"])
    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more" })).toBeNull())
  })
})

describe("call for improvements detail", () => {
  test("CFI-ADM-04 shows every field, the reporter, the page and the attachments with a download", async () => {
    server.use(http.get(apiUrl("/v1/admin/feedback/fb-1"), () => HttpResponse.json(detail)))
    renderAdmin(<FeedbackDetailPage />, { route: "/call-for-improvements/view/?id=fb-1" })

    expect(await screen.findByText("The cover of the Algebra book shows a grey box.")).toBeInTheDocument()
    expect(screen.getByText("Library")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Karimova Dilnoza" })).toBeInTheDocument()
    expect(screen.getByText("2TN2")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "https://my.ihsu.uz/library/algebra" })).toBeInTheDocument()
    expect(await screen.findByRole("img", { name: "Preview of screenshot.png" })).toHaveAttribute(
      "src",
      "https://files.test/file-1?sig=test",
    )
    const download = await screen.findByRole("link", { name: "Download screenshot.png" })
    expect(download).toHaveAttribute("href", "https://files.test/file-1?sig=test")
  })

  test("CFI-ADM-05 changes the status with PATCH and shows the delivery result per channel", async () => {
    let patched: unknown = null
    server.use(
      http.get(apiUrl("/v1/admin/feedback/fb-1"), () => HttpResponse.json(detail)),
      http.patch(apiUrl("/v1/admin/feedback/fb-1"), async ({ request }) => {
        patched = await request.json()
        return HttpResponse.json({ ...detail, status: "done" })
      }),
      fileUrlHandler(),
    )
    const { user } = renderAdmin(<FeedbackDetailPage />, { route: "/call-for-improvements/view/?id=fb-1" })
    await screen.findByText("Fixed in the next release.")

    expect(screen.getByText("Telegram: Sent")).toBeInTheDocument()
    expect(screen.getByText("Mail: Failed")).toBeInTheDocument()

    await selectDropdownOption(user, screen.getByRole("combobox", { name: "Status" }), "Done")

    await waitFor(() => expect(patched).toEqual({ status: "done" }))
  })

  test("CFI-ADM-06 sends a reply through Telegram by default and asks for text and a channel", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.get(apiUrl("/v1/admin/feedback/fb-1"), () => HttpResponse.json(detail)),
      http.post(apiUrl("/v1/admin/feedback/fb-1/responses"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...detail.responses[0], id: "resp-2" }, { status: 201 })
      }),
      fileUrlHandler(),
    )
    const { user } = renderAdmin(<FeedbackDetailPage />, { route: "/call-for-improvements/view/?id=fb-1" })
    await screen.findByText("Fixed in the next release.")

    const telegram = screen.getByRole("checkbox", { name: "Telegram" })
    const mail = screen.getByRole("checkbox", { name: "Mail" })
    expect(telegram).toBeChecked()
    expect(mail).not.toBeChecked()

    await user.click(screen.getByRole("button", { name: "Send reply" }))
    expect(await screen.findByText("Write a reply.")).toBeInTheDocument()
    expect(body).toBeNull()

    setValue(screen.getByLabelText("Message"), "  Thanks, we are on it.  ")
    await user.click(telegram)
    await user.click(screen.getByRole("button", { name: "Send reply" }))
    expect(await screen.findByText("Choose at least one channel.")).toBeInTheDocument()

    await user.click(mail)
    await user.click(screen.getByRole("button", { name: "Send reply" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ text: "Thanks, we are on it.", attachment_file_ids: [], channels: ["mail"] })
  })
})
