/** The pages of /manage/: the role guard of every route, and that a librarian reaches the real screens. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import type { ComponentType } from "react"
import BooksEditPage from "../app/manage/books/edit/page"
import BooksPage from "../app/manage/books/page"
import CollectionsPage from "../app/manage/collections/page"
import QueuePage from "../app/manage/queue/page"
import ReportsPage from "../app/manage/reports/page"
import StatsPage from "../app/manage/stats/page"
import SubjectsPage from "../app/manage/subjects/page"
import TopicsPage from "../app/manage/topics/page"
import UniLibraryPage from "../app/manage/unilibrary/page"
import { renderLibraryApp } from "./helpers"

function asLibrary(): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "library" }
  resetConfig()
}

const LIBRARIAN_PAGES: [route: string, Page: ComponentType, heading: string][] = [
  ["/manage/queue/", QueuePage, "Review queue"],
  ["/manage/books/", BooksPage, "Books"],
  ["/manage/books/edit/", BooksEditPage, "New book"],
  ["/manage/topics/", TopicsPage, "Topics"],
  ["/manage/subjects/", SubjectsPage, "Subjects"],
  ["/manage/collections/", CollectionsPage, "Collections"],
  ["/manage/reports/", ReportsPage, "Reports"],
  ["/manage/stats/", StatsPage, "Statistics"],
]

describe("the /manage/ pages: role guard", () => {
  for (const [route, Page, heading] of LIBRARIAN_PAGES) {
    it(`${route} shows a student 'No access' and a librarian the page`, async () => {
      asLibrary()
      setLibraryActor("student")
      const student = renderLibraryApp(<Page />, { route })
      expect(await screen.findByText("No access")).toBeInTheDocument()
      expect(screen.queryByRole("heading", { level: 1, name: heading })).not.toBeInTheDocument()
      student.unmount()

      setLibraryActor("librarian")
      renderLibraryApp(<Page />, { route, session: { user: { ...userMe, roles: ["student", "librarian"] } } })
      expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument()
    })
  }

  it("/manage/unilibrary/ is for administrators only: a librarian sees 'No access'", async () => {
    asLibrary()
    setLibraryActor("librarian")
    const librarian = renderLibraryApp(<UniLibraryPage />, {
      route: "/manage/unilibrary/",
      session: { user: { ...userMe, roles: ["student", "librarian"] } },
    })
    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1, name: "UniLibrary" })).not.toBeInTheDocument()
    librarian.unmount()

    setLibraryActor("admin")
    renderLibraryApp(<UniLibraryPage />, {
      route: "/manage/unilibrary/",
      session: { user: { ...userMe, roles: ["admin"] } },
    })
    expect(await screen.findByRole("heading", { level: 1, name: "UniLibrary" })).toBeInTheDocument()
    expect(await screen.findByRole("switch", { name: "Enable UniLibrary" })).toBeInTheDocument()
  })

  it("an administrator also reaches the librarian pages", async () => {
    asLibrary()
    setLibraryActor("admin")
    renderLibraryApp(<QueuePage />, {
      route: "/manage/queue/",
      session: { user: { ...userMe, roles: ["admin"] } },
    })

    expect(await screen.findByRole("heading", { level: 1, name: "Review queue" })).toBeInTheDocument()
  })
})
