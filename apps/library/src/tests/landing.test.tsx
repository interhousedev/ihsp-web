/** The library's `/`: the catalogue for a visitor, the personal home for a signed-in user. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { apiUrl, problem, server, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { http } from "msw"
import Page from "../app/page"
import { renderLibraryApp } from "./helpers"

function asLibrary(): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "library" }
  resetConfig()
}

describe("library landing page", () => {
  it("shows an anonymous visitor the catalogue", async () => {
    asLibrary()
    setLibraryActor(null)
    server.use(http.post(apiUrl("/v1/oauth/refresh"), () => problem(401, "auth/unauthorized", "No session")))
    renderLibraryApp(<Page />, { session: null })

    expect(await screen.findByRole("heading", { level: 1, name: "Browse" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1, name: "Library" })).not.toBeInTheDocument()
  })

  it("shows a signed-in user the personal home", async () => {
    asLibrary()
    setLibraryActor("student")
    renderLibraryApp(<Page />, { session: { user: userMe } })

    expect(await screen.findByRole("heading", { level: 1, name: "Library" })).toBeInTheDocument()
  })
})
