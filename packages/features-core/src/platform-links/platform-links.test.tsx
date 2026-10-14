import { describe, expect, it } from "bun:test"
import type { Role } from "@ihsp/api"
import { resetConfig } from "@ihsp/config"
import { teacherMe, userMe } from "@ihsp/test-utils"
import { renderWithProviders } from "@ihsp/test-utils"
import { UserMenu, type PlatformLink } from "@ihsp/ui"
import { screen, within } from "@testing-library/react"
import { platformKeysFor } from "./platform-keys"
import { usePlatformLinks } from "./use-platform-links"

function setClient(client: "id" | "sp" | "staff" | "admin" | "lms" | "share" | "library") {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

function Links({ onLinks }: { onLinks: (links: PlatformLink[]) => void }) {
  onLinks(usePlatformLinks())
  return null
}

function linksFor(
  roles: Role[],
  client: "id" | "sp" | "staff" | "admin" | "lms" | "share" | "library" = "sp",
): PlatformLink[] {
  setClient(client)
  let seen: PlatformLink[] = []
  renderWithProviders(<Links onLinks={(links) => (seen = links)} />, { session: { user: { ...userMe, roles } } })
  return seen
}

describe("platformKeysFor", () => {
  it("gives a student SP, LMS, the Library and ID", () => {
    expect(platformKeysFor(["student"])).toEqual(["sp", "lms", "library", "id"])
  })

  it("gives a teacher Staff, LMS, the Library and ID", () => {
    expect(platformKeysFor(["teacher"])).toEqual(["staff", "lms", "library", "id"])
  })

  it("gives an admin Admin, LMS, the Library and ID, and Staff only when the admin is also a teacher", () => {
    expect(platformKeysFor(["admin"])).toEqual(["admin", "lms", "library", "id"])
    expect(platformKeysFor(["admin", "teacher"])).toEqual(["staff", "admin", "lms", "library", "id"])
  })

  it("gives an LMS administrator LMS, the Library and ID", () => {
    expect(platformKeysFor(["lms_admin"])).toEqual(["lms", "library", "id"])
  })

  it("gives a course creator LMS, the Library and ID, next to the teacher's Staff", () => {
    expect(platformKeysFor(["lms_creator"])).toEqual(["lms", "library", "id"])
    expect(platformKeysFor(["teacher", "lms_creator"])).toEqual(["staff", "lms", "library", "id"])
  })

  it("gives a librarian the Library and ID, and adds up with the student roles", () => {
    expect(platformKeysFor(["librarian"])).toEqual(["library", "id"])
    expect(platformKeysFor(["student", "librarian"])).toEqual(["sp", "lms", "library", "id"])
  })

  it("always offers the account", () => {
    expect(platformKeysFor([])).toEqual(["id"])
  })
})

describe("usePlatformLinks", () => {
  it("builds named links with a short description from the runtime config addresses", () => {
    const links = linksFor(["student"])

    expect(links.map((link) => [link.key, link.name, link.description, link.href])).toEqual([
      ["sp", "my.iht", "Student portal", "http://localhost:3002"],
      ["lms", "lms.iht", "Courses", "http://localhost:3005"],
      ["library", "library.iht", "Books & materials", "http://localhost:3008"],
      ["id", "IHT ID", "Account & security", "http://localhost:3001"],
    ])
  })

  it("leaves the Library out when its address is not configured", () => {
    window.__ENV__ = { ...(window.__ENV__ as object), LIBRARY_URL: "" }
    resetConfig()
    let seen: PlatformLink[] = []
    renderWithProviders(<Links onLinks={(links) => (seen = links)} />, {
      session: { user: { ...userMe, roles: ["student"] } },
    })

    expect(seen.map((link) => link.key)).toEqual(["sp", "lms", "id"])
  })

  it("sends the separately installed apps to their install steps on the apps hub in the installed app", () => {
    window.__ENV__ = { ...(window.__ENV__ as object), APP_MODE: "pwa", APP_URL: "https://app.ihsu.uz/" }
    try {
      const links = linksFor(["student"], "sp")

      expect(links.map((link) => [link.key, link.href])).toEqual([
        ["sp", "http://localhost:3002"],
        ["lms", "https://app.ihsu.uz/install/?app=lms"],
        ["library", "https://app.ihsu.uz/install/?app=library"],
        ["id", "http://localhost:3001"],
      ])
    } finally {
      window.__ENV__ = { ...(window.__ENV__ as object), APP_MODE: "sp", APP_URL: undefined }
      resetConfig()
    }
  })

  it("marks only the app the user is in", () => {
    const links = linksFor(["admin", "teacher"], "admin")

    expect(links.filter((link) => link.current).map((link) => link.key)).toEqual(["admin"])
  })

  it("is empty for an anonymous visitor", () => {
    setClient("share")
    let seen: PlatformLink[] = [{ key: "id", name: "x", description: "x", href: "x", current: false }]
    renderWithProviders(<Links onLinks={(links) => (seen = links)} />, { session: null })

    expect(seen).toEqual([])
  })
})

function Menu({ client }: { client: "sp" | "lms" }) {
  setClient(client)
  return <MenuWithLinks />
}

function MenuWithLinks() {
  const platforms = usePlatformLinks()
  return <UserMenu name="Ali" onLogout={() => undefined} platforms={platforms} />
}

describe("UserMenu with platform links", () => {
  it("lists the platforms of the role, marks the current one and opens the others by plain links", async () => {
    const { user } = renderWithProviders(<Menu client="lms" />, {
      session: { user: { ...teacherMe, roles: ["teacher"] } },
    })

    await user.click(screen.getByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    const lms = within(menu).getByRole("menuitem", { name: /lms\.iht/ })
    expect(lms).toHaveAttribute("aria-current", "page")
    expect(lms).toHaveTextContent("Courses")
    const staff = within(menu).getByRole("menuitem", { name: /Учителям/ })
    expect(staff).toHaveAttribute("href", "http://localhost:3003")
    expect(staff).not.toHaveAttribute("target")
    expect(staff).not.toHaveAttribute("aria-current")
    expect(within(menu).getByRole("menuitem", { name: /IHT ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).queryByRole("menuitem", { name: /admin\.iht/ })).not.toBeInTheDocument()
    expect(within(menu).queryByRole("menuitem", { name: /my\.iht/ })).not.toBeInTheDocument()
  })
})
