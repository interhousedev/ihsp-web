/** The pages of the upload wizard and the reading-list editor: the access rule of each route and the screen behind it. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { libIds, setLibraryActor, teacherMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import ListEditPage from "../app/lists/edit/page"
import UploadEditPage from "../app/upload/edit/page"
import UploadPage from "../app/upload/page"
import { renderLibraryApp } from "./helpers"

function asLibrary(): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "library" }
  resetConfig()
}

describe("the upload pages", () => {
  it("/upload/ shows a signed-in user the wizard", async () => {
    asLibrary()
    renderLibraryApp(<UploadPage />, { route: "/upload/" })

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
