import { describe, expect, it } from "bun:test"
import { apiUrl, server, setLibraryActor, userMe } from "@ihsp/test-utils"
import { Toaster } from "@ihsp/ui"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { BooksPage } from "./books-page"

allowSlowRenders()

describe("BackfillButton", () => {
  it("is shown to a librarian, confirms, calls both backfills and reports the start", async () => {
    setLibraryActor("librarian")
    const called: string[] = []
    server.use(
      http.post(apiUrl("/v1/manage/library/covers/backfill"), () => {
        called.push("covers")
        return new HttpResponse(null, { status: 202 })
      }),
      http.post(apiUrl("/v1/manage/library/pages/backfill"), () => {
        called.push("pages")
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { user } = renderLibrary(
      <>
        <BooksPage />
        <Toaster />
      </>,
      {
        route: "/manage/books/",
        session: { user: { ...userMe, roles: ["student", "librarian"] } },
      },
    )

    await user.click(await screen.findByRole("button", { name: "Rebuild covers and text" }))
    expect(await screen.findByText("Rebuild covers and page text?")).toBeInTheDocument()
    expect(called).toEqual([])
    await user.click(screen.getByRole("button", { name: "Start" }))

    await waitFor(() => expect(called.sort()).toEqual(["covers", "pages"]))
    expect(await screen.findByText(/Started\. Covers and page text/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText("Rebuild covers and page text?")).not.toBeInTheDocument())
  })
})
