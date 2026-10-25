/** The pages of the upload wizard and the reading-list editor: the access rule of each route and the screen behind it. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { libIds, setLibraryActor, teacherMe, userMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import ListEditPage from "../app/lists/edit/page"
import UploadEditPage from "../app/upload/edit/page"
import UploadMaterialPage from "../app/upload/material/page"
import UploadPage from "../app/upload/page"
import { renderLibraryApp } from "./helpers"

function asLibrary(): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "library" }
  resetConfig()
}

describe("the upload pages", () => {
  it("/upload/ shows a student the book form, which sends a suggestion", async () => {
    asLibrary()
    setLibraryActor("student")
    renderLibraryApp(<UploadPage />, { route: "/upload/", session: { user: { ...userMe, roles: ["student"] } } })

    expect(await screen.findByRole("heading", { level: 1, name: "Add a book" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send suggestion" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Create book" })).not.toBeInTheDocument()
  })

  it("/upload/ shows a librarian the book editor that creates the book", async () => {
    asLibrary()
    setLibraryActor("librarian")
    renderLibraryApp(<UploadPage />, {
      route: "/upload/",
      session: { user: { ...userMe, roles: ["student", "librarian"] } },
    })

    expect(await screen.findByRole("heading", { level: 1, name: "New book" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create book" })).toBeInTheDocument()
  })

  it("/upload/material/ shows the material wizard", async () => {
    asLibrary()
    renderLibraryApp(<UploadMaterialPage />, { route: "/upload/material/" })

    expect(await screen.findByRole("heading", { level: 1, name: "Add a material" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Kind of file" })).toBeInTheDocument()
  })

  it("/upload/edit/?id= opens a draft of the user", async () => {
    asLibrary()
    renderLibraryApp(<UploadEditPage />, { route: `/upload/edit/?id=${libIds.matDraft}` })

    expect(await screen.findByRole("heading", { level: 1, name: "Continue your upload" })).toBeInTheDocument()
  })
})

describe("/lists/edit/", () => {
  it("shows a student 'No access'", async () => {
    asLibrary()
    setLibraryActor("student")
    renderLibraryApp(<ListEditPage />, { route: "/lists/edit/" })

    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1, name: "New reading list" })).not.toBeInTheDocument()
  })

  it("shows a teacher the editor", async () => {
    asLibrary()
    setLibraryActor("teacher")
    renderLibraryApp(<ListEditPage />, { route: "/lists/edit/", session: { user: teacherMe } })

    expect(await screen.findByRole("heading", { level: 1, name: "New reading list" })).toBeInTheDocument()
  })
})
