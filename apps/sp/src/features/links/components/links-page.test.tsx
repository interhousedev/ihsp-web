import { describe, expect, it } from "bun:test"
import { apiUrl, filePdf, ids, linkItems, linkUrl, problem, selectDropdownValue, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, enter, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { canDelete, canRevoke, isHttpUrl, linkStatus } from "../utils/link-display"
import { LinksPage } from "./links-page"

allowSlowRenders()

/** The shared test adapter forgets URL changes on re-render; this one keeps them, like a real browser. */
function renderLinks(search = "") {
  return renderTools(
    <NuqsTestingAdapter searchParams={search} hasMemory>
      <LinksPage />
    </NuqsTestingAdapter>,
    { route: `/links/${search}` },
  )
}

function rowOf(name: string): HTMLElement {
  return screen.getByRole("heading", { name }).closest("[data-link-id]") as HTMLElement
}

describe("LinksPage: list and filter (UF-WEB-26, WEB-26)", () => {
  it("lists all links with kind, target, short URL, hits and status", async () => {
    renderLinks()

    await screen.findByRole("heading", { name: "Khan Academy: physics" })

    const url = rowOf("Khan Academy: physics")
    expect(within(url).getByText("Link")).toBeInTheDocument()
    expect(within(url).getByText("https://www.khanacademy.org/science/physics")).toBeInTheDocument()
    expect(within(url).getByRole("link", { name: "http://localhost:8000/s/a1b2c3" })).toBeInTheDocument()
    expect(within(url).getByText("12 clicks")).toBeInTheDocument()
    expect(within(rowOf("Kinematics revision")).getByText("Snapshot")).toBeInTheDocument()
    expect(within(rowOf("Physics: kinematics")).getByText("Flash cards")).toBeInTheDocument()
    expect(within(rowOf("Old link")).getByText("Revoked")).toBeInTheDocument()
  })

  it("filters by kind through the server", async () => {
    const asked: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/me/links"), ({ request }) => {
        const kind = new URL(request.url).searchParams.get("kind")
        asked.push(kind)
        return HttpResponse.json({ items: linkItems.filter((item) => !kind || item.kind === kind), next_cursor: null })
      }),
    )
    const { user } = renderLinks()
    await screen.findByRole("heading", { name: "Khan Academy: physics" })

    await user.click(screen.getByRole("button", { name: "Chats" }))

    await waitFor(() => expect(asked).toContain("chat"))
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Khan Academy: physics" })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("heading", { name: "Kinematics revision" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Chats" })).toHaveAttribute("aria-pressed", "true")
  })

  it("starts with the kind from the address", async () => {
    renderLinks("?kind=file")

    expect(await screen.findByRole("heading", { name: "lab-setup.jpg" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Khan Academy: physics" })).not.toBeInTheDocument()
  })

  it("shows lesson attachments with a link to the lesson and no delete", async () => {
    server.use(
      http.get(apiUrl("/v1/me/links"), () =>
        HttpResponse.json({
          items: [{ ...linkUrl, title: "Worksheet", lesson_id: ids.lessonPhysicsToday }],
          next_cursor: null,
        }),
      ),
    )
    renderLinks()

    const row = (await screen.findByRole("heading", { name: "Worksheet" })).closest("[data-link-id]") as HTMLElement
    expect(within(row).getByText("Lesson attachment")).toBeInTheDocument()
    expect(within(row).getByRole("link", { name: "Open lesson" })).toBeInTheDocument()
    expect(within(row).queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument()
  })

  it("shows an empty state and an error state", async () => {
    server.use(http.get(apiUrl("/v1/me/links"), () => HttpResponse.json({ items: [], next_cursor: null })))
    const first = renderLinks()
    expect(await screen.findByText("You have no links yet.")).toBeInTheDocument()
    first.unmount()

    server.use(http.get(apiUrl("/v1/me/links"), () => HttpResponse.error()))
    renderLinks()
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})

describe("LinksPage: revoke and delete (SL-7, SHR-6)", () => {
  it("revokes a share after confirmation", async () => {
    let revoked = ""
    server.use(
      http.post(apiUrl("/v1/links/:id/revoke"), ({ params }) => {
        revoked = String(params.id)
        return HttpResponse.json({ ...linkItems[2], revoked_at: "2026-10-07T05:30:00Z" })
      }),
    )
    const { user } = renderLinks()
    await screen.findByRole("heading", { name: "Kinematics revision" })

    await user.click(within(rowOf("Kinematics revision")).getByRole("button", { name: "Revoke Kinematics revision" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(revoked).toBe("")
    await user.click(within(dialog).getByRole("button", { name: "Revoke" }))

    await waitFor(() => expect(revoked).toBe(ids.linkChat))
  })

  it("deletes a short link after confirmation", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/links/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderLinks()
    await screen.findByRole("heading", { name: "Khan Academy: physics" })

    await user.click(
      within(rowOf("Khan Academy: physics")).getByRole("button", { name: "Delete Khan Academy: physics" }),
    )
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toBe(ids.link))
  })

  it("offers revoke only for shares and delete only for short links", async () => {
    renderLinks()
    await screen.findByRole("heading", { name: "Khan Academy: physics" })

    expect(within(rowOf("Khan Academy: physics")).queryByRole("button", { name: /Revoke/ })).not.toBeInTheDocument()
    expect(within(rowOf("Kinematics revision")).queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument()
    expect(within(rowOf("Old link")).queryByRole("button", { name: /Revoke/ })).not.toBeInTheDocument()
  })
})

async function openDialog(user: ReturnType<typeof renderLinks>["user"]) {
  await screen.findByRole("heading", { name: "Khan Academy: physics" })
  await user.click(screen.getAllByRole("button", { name: "New short link" })[0] as HTMLElement)
  return screen.findByRole("dialog")
}

describe("LinksPage: new short link (UF-WEB-26 step 2, SL-1)", () => {
  it("creates a short link to a web address", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/links"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          ...linkUrl,
          id: "00000009-0000-4000-8000-0000000000dd",
          slug: "new123",
          url: "http://localhost:8000/s/new123",
        })
      }),
    )
    const { user } = renderLinks()
    const dialog = await openDialog(user)

    await enter(user, within(dialog).getByLabelText("Address (http or https)"), "https://example.com/lecture")
    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    await waitFor(() => expect(body).toEqual({ kind: "url", target_url: "https://example.com/lecture" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("does not create a link for an address that is not http or https", async () => {
    const { user } = renderLinks()
    const dialog = await openDialog(user)

    await enter(user, within(dialog).getByLabelText("Address (http or https)"), "ftp://example.com/file")

    expect(within(dialog).getByText(/starts with http:\/\/ or https:\/\//)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Create link" })).toBeDisabled()
  })

  it("shows why the backend blocked an address", async () => {
    server.use(http.post(apiUrl("/v1/links"), () => problem(422, "links/blocked-url", "Blocked")))
    const { user } = renderLinks()
    const dialog = await openDialog(user)

    await enter(user, within(dialog).getByLabelText("Address (http or https)"), "https://bad.example/")
    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    expect(await within(dialog).findByText("This address cannot be shortened.")).toBeInTheDocument()
  })

  it("creates a short link to one of My files", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/links"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ ...linkUrl, kind: "file", file: filePdf, url: "http://localhost:8000/s/file99" })
      }),
    )
    const { user } = renderLinks()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "File" }))
    const select = await within(dialog).findByLabelText("File")
    await selectDropdownValue(user, select, ids.file)
    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    await waitFor(() => expect(body).toEqual({ kind: "file", file_id: ids.file }))
  })

  it("uploads a new file in the dialog and selects it", async () => {
    const { user } = renderLinks()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "File" }))
    fireEvent.change(within(dialog).getByTestId("file-upload-input"), {
      target: { files: [new File(["notes"], "fresh-notes.pdf", { type: "application/pdf" })] },
    })

    await waitFor(() => expect(within(dialog).getByLabelText("File")).toHaveTextContent("fresh-notes.pdf"))
    expect(within(dialog).getByRole("button", { name: "Create link" })).toBeEnabled()
  })
})

describe("link helpers", () => {
  it("derives the status of a link", () => {
    const now = Date.parse("2026-10-07T05:00:00Z")
    expect(linkStatus(linkUrl, now)).toBe("active")
    expect(linkStatus({ ...linkUrl, revoked_at: "2026-10-01T00:00:00Z" }, now)).toBe("revoked")
    expect(linkStatus({ ...linkUrl, disabled: true }, now)).toBe("disabled")
    expect(linkStatus({ ...linkUrl, expires_at: "2026-10-06T00:00:00Z" }, now)).toBe("expired")
  })

  it("allows revoke for active shares and delete for short links outside lessons", () => {
    expect(canRevoke(linkItems[2]!)).toBe(true)
    expect(canRevoke({ ...linkItems[2]!, revoked_at: "2026-10-01T00:00:00Z" })).toBe(false)
    expect(canRevoke(linkUrl)).toBe(false)
    expect(canDelete(linkUrl)).toBe(true)
    expect(canDelete({ ...linkUrl, lesson_id: ids.lessonPhysicsToday })).toBe(false)
    expect(canDelete(linkItems[2]!)).toBe(false)
  })

  it("accepts only http and https addresses", () => {
    expect(isHttpUrl("https://example.com")).toBe(true)
    expect(isHttpUrl(" http://example.com/a?b=1 ")).toBe(true)
    expect(isHttpUrl("ftp://example.com")).toBe(false)
    expect(isHttpUrl("javascript:alert(1)")).toBe(false)
    expect(isHttpUrl("example.com")).toBe(false)
  })
})
