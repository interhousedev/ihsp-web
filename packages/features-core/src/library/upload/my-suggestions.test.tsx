import { describe, expect, it } from "bun:test"
import { apiUrl, server, setLibraryActor } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { renderLibrary } from "../test-support"
import { MySuggestions } from "./my-suggestions"

describe("MySuggestions", () => {
  it("lists the statuses, the reason of a decline and a link to an added book", async () => {
    setLibraryActor("student")
    server.use(
      http.get(apiUrl("/v1/me/library/suggestions"), () =>
        HttpResponse.json({
          items: [
            {
              id: "s1",
              title: "Optics",
              status: "accepted",
              created_at: "2026-10-10T09:00:00Z",
              decided_at: "2026-10-11T09:00:00Z",
              reason: null,
              item_id: "b1",
            },
            {
              id: "s2",
              title: "Atlas",
              status: "declined",
              created_at: "2026-10-09T09:00:00Z",
              decided_at: "2026-10-10T09:00:00Z",
              reason: "We already have it",
              item_id: null,
            },
            {
              id: "s3",
              title: "Poems",
              status: "new",
              created_at: "2026-10-08T09:00:00Z",
              decided_at: null,
              reason: null,
              item_id: null,
            },
          ],
        }),
      ),
    )
    renderLibrary(<MySuggestions />, { route: "/my/?tab=suggestions" })

    expect(await screen.findByText("Optics")).toBeInTheDocument()
    expect(screen.getByText("Added to the library")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open the book" })).toHaveAttribute("href", expect.stringContaining("b1"))
    expect(screen.getByText("We already have it")).toBeInTheDocument()
    expect(screen.getByText("Waiting for a librarian")).toBeInTheDocument()
  })

  it("has an empty state", async () => {
    setLibraryActor("student")
    renderLibrary(<MySuggestions />, { route: "/my/?tab=suggestions" })
    expect(await screen.findByText("You have not suggested a book yet.")).toBeInTheDocument()
  })
})
