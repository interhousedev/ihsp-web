import { describe, expect, it } from "bun:test"
import { apiUrl, server, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { BookEditor } from "./book-editor"

allowSlowRenders()

function renderSuggest() {
  setLibraryActor("student")
  return renderLibrary(<BookEditor id={null} mode="suggest" />, {
    route: "/upload/suggest/",
    session: { user: { ...userMe, roles: ["student"] } },
  })
}

describe("BookEditor in suggest mode", () => {
  it("offers the librarian's book fields, with authors and tags from autocomplete, and sends them to the queue", async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.post(apiUrl("/v1/library/suggestions"), async ({ request }) => {
        bodies.push((await request.clone().json()) as Record<string, unknown>)
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderSuggest()

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Publish checklist/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Title/), "Otkan kunlar")

    await user.type(screen.getByRole("combobox", { name: "Authors" }), "Alish")
    const option = await screen.findByRole("option", { name: /Alisher Navoiy/ })
    await user.click(option)
    expect(screen.getByRole("list", { name: "Authors" })).toHaveTextContent("Alisher Navoiy")

    await user.type(screen.getByRole("combobox", { name: "Tags" }), "novel{Enter}")
    expect(screen.getByRole("list", { name: "Tags" })).toHaveTextContent("novel")

    await user.type(screen.getByLabelText("Link (optional)"), "https://example.org/book")
    await user.type(screen.getByLabelText("Note for the librarian (optional)"), "A classic")
    await user.click(screen.getByRole("button", { name: "Send suggestion" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      title: "Otkan kunlar",
      url: "https://example.org/book",
      note: "A classic",
      book: {
        title: "Otkan kunlar",
        authors: ["Alisher Navoiy"],
        tags: ["novel"],
        language: "uz_latn",
        type: "textbook",
      },
    })
  })

  it("does not send a link that is not http or https", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/library/suggestions"), async ({ request }) => {
        bodies.push(await request.clone().json())
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const { user } = renderSuggest()
    await user.type(screen.getByLabelText(/^Title/), "Otkan kunlar")
    await user.type(screen.getByRole("combobox", { name: "Authors" }), "Alisher Navoiy{Enter}")
    await user.type(screen.getByLabelText("Link (optional)"), "not a link")

    await user.click(screen.getByRole("button", { name: "Send suggestion" }))
    const form = screen.getByRole("button", { name: "Send suggestion" }).closest("form") as HTMLElement
    expect(await within(form).findByText("Enter a link that starts with http:// or https://")).toBeInTheDocument()
    expect(bodies).toEqual([])
  })
})
