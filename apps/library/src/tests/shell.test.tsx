/** The library shell: public pages for visitors, the signed-in entries, the librarian group and the role guard. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { apiUrl, problem, server, setLibraryActor, teacherMe, userMe } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { http } from "msw"
import { useNav } from "../config/nav"
import { LibraryShell } from "../features/shell/components/library-shell"
import { renderLibraryApp } from "./helpers"

function asLibrary(): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "library" }
  resetConfig()
}

function expectLabels(labels: string[], wanted: string[]): void {
  for (const label of wanted) expect(labels).toContain(label)
}

/** The sidebar entries come from `useNav`; the sidebar itself is a sheet on the phone-sized test window. */
function NavProbe() {
  const { groups, bottom } = useNav()
  return (
    <>
      <ul aria-label="nav probe">
        {groups
          .flatMap((group) => group.items)
          .map((item) => (
            <li key={item.url}>{item.title}</li>
          ))}
      </ul>
      <ul aria-label="bottom probe">
        {bottom.map((item) => (
          <li key={item.url}>{item.title}</li>
        ))}
      </ul>
    </>
  )
}

function bottomLabels(): string[] {
  return within(screen.getByRole("list", { name: "bottom probe" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "")
}

function navLabels(): string[] {
  return within(screen.getByRole("list", { name: "nav probe" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "")
}

describe("LibraryShell", () => {
  it("shows a visitor the public entries and a Sign in button, never a login by itself", async () => {
    asLibrary()
    setLibraryActor(null)
    server.use(http.post(apiUrl("/v1/oauth/refresh"), () => problem(401, "auth/unauthorized", "No session")))
    renderLibraryApp(
      <LibraryShell access="public">
        <p>page body</p>
        <NavProbe />
      </LibraryShell>,
      { session: null },
    )

    expect(await screen.findByText("page body")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument()
    const labels = navLabels()
    expect(labels).toContain("Home")
    expect(labels).toContain("Browse")
    expect(labels).not.toContain("My library")
    expect(labels).not.toContain("Review queue")
  })

  it("shows a student My library and Add a material, but no librarian group", async () => {
    asLibrary()
    renderLibraryApp(
      <LibraryShell access="auth">
        <p>page body</p>
        <NavProbe />
      </LibraryShell>,
    )

    expect(await screen.findByText("page body")).toBeInTheDocument()
    await screen.findByRole("button", { name: "Account menu" })
    const labels = navLabels()
    expectLabels(labels, ["Home", "Browse", "My library", "Add a material", "Reading lists"])
    expect(labels).not.toContain("Review queue")
    expect(labels).not.toContain("UniLibrary")
    expect(bottomLabels()).toEqual(["Home", "Browse", "My library"])
  })

  it("shows a librarian the Manage entries, and only an administrator the UniLibrary page", async () => {
    asLibrary()
    const librarian = renderLibraryApp(
      <LibraryShell access="auth">
        <p>page body</p>
        <NavProbe />
      </LibraryShell>,
      { session: { user: { ...userMe, roles: ["student", "librarian"] } } },
    )
    await screen.findByText("page body")
    expectLabels(navLabels(), ["Review queue", "Books", "Topics", "Collections", "Reports", "Statistics"])
    expect(navLabels()).not.toContain("UniLibrary")
    expect(bottomLabels()).toEqual(["Home", "Browse", "My library", "Review queue"])
    librarian.unmount()

    renderLibraryApp(
      <LibraryShell access="auth">
        <p>page body</p>
        <NavProbe />
      </LibraryShell>,
      { session: { user: { ...userMe, roles: ["admin"] } } },
    )
    await screen.findByText("page body")
    expect(navLabels()).toContain("UniLibrary")
  })

  it("guards a role page: a student sees 'No access', a librarian sees the page", async () => {
    asLibrary()
    const student = renderLibraryApp(
      <LibraryShell access={{ roles: ["librarian", "admin"] }}>
        <p>manage body</p>
      </LibraryShell>,
    )
    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("manage body")).not.toBeInTheDocument()
    student.unmount()

    renderLibraryApp(
      <LibraryShell access={{ roles: ["librarian", "admin"] }}>
        <p>manage body</p>
      </LibraryShell>,
      { session: { user: { ...userMe, roles: ["librarian"] } } },
    )
    expect(await screen.findByText("manage body")).toBeInTheDocument()
  })

  it("lists the Library among the platforms of a teacher's profile menu", async () => {
    asLibrary()
    const { user } = renderLibraryApp(
      <LibraryShell access="auth">
        <p>page body</p>
      </LibraryShell>,
      { session: { user: { ...teacherMe, roles: ["teacher"] } } },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /library\.iht/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /Учителям/ })).toHaveAttribute("href", "http://localhost:3003")
  })
})
