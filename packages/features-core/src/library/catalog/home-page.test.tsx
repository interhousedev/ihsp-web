import { describe, expect, it } from "bun:test"
import { setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { LibraryHomePage } from "./home-page"

allowSlowRenders()

describe("LibraryHomePage", () => {
  it("shows the search box, subject shelves with counts and the recently added items", async () => {
    renderLibrary(<LibraryHomePage />)

    expect(screen.getByRole("search")).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Subjects" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Recently added" })).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: "Physics 10: Mechanics" })).toBeInTheDocument()
  })

  it("shows continue reading to a signed-in student", async () => {
    renderLibrary(<LibraryHomePage />)

    expect(await screen.findByRole("heading", { name: "Continue reading" })).toBeInTheDocument()
  })

  it("offers Sign in to a signed-out visitor and keeps the public items", async () => {
    renderLibraryAnonymous(<LibraryHomePage />)

    await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in to see more" })).toBeInTheDocument())
    expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("heading", { name: "Continue reading" })).not.toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Recently added" })).toBeInTheDocument()
  })

  it("shows no UniLibrary card while UniLibrary is off, and does so when it is on only in the browse tab", async () => {
    renderLibrary(<LibraryHomePage />)
    await screen.findByRole("heading", { name: "Recently added" })
    const recent = screen.getByRole("list", { name: "Recently added" })

    expect(within(recent).queryByText("UniLibrary")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Open on UniLibrary" })).not.toBeInTheDocument()
  })

  it("keeps a failed section out of the page", async () => {
    setUniLibrary({ enabled: false })
    renderLibrary(<LibraryHomePage />)

    expect(await screen.findByRole("heading", { name: "Recently added" })).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
