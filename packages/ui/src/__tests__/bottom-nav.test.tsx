import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { BottomNav } from "../components/layout/bottom-nav"
import { filterNavGroups, isActivePath, type BottomNavItem, type NavGroup } from "../components/layout/nav-types"

const items: BottomNavItem[] = [
  { title: "Today", url: "/", icon: "home", match: "exact" },
  { title: "Timetable", url: "/timetable/", icon: "timetable" },
  { title: "Grades", url: "/grades/", icon: "grades" },
  { title: "Homework", url: "/homework/", icon: "homework" },
]

const nav: NavGroup[] = [
  { label: "Academics", items: items.map(({ title, url, icon }) => ({ title, url, icon })) },
  { label: "Account", items: [{ title: "Settings", url: "/settings/", icon: "settings" }] },
]

describe("BottomNav", () => {
  it("marks the item of the current page as active", () => {
    renderWithProviders(<BottomNav items={items} />, { route: "/grades/" })

    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(within(bar).getByRole("link", { name: "Grades" })).toHaveAttribute("aria-current", "page")
    expect(within(bar).getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current")
    expect(within(bar).getByRole("link", { name: "Homework" })).not.toHaveAttribute("aria-current")
  })

  it("keeps a section active on its sub-pages, and the root item only on the root", () => {
    renderWithProviders(<BottomNav items={items} />, { route: "/grades/semester/?tab=day" })

    expect(screen.getByRole("link", { name: "Grades" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current")
  })

  it("shows at most five slots: four items and More when the full navigation is given", () => {
    renderWithProviders(<BottomNav items={[...items, { title: "Extra", url: "/extra/", icon: "files" }]} more={nav} />)

    const bar = screen.getByRole("navigation", { name: "Quick navigation" })
    expect(within(bar).getAllByRole("link")).toHaveLength(4)
    expect(within(bar).getByRole("button", { name: "More" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Extra" })).not.toBeInTheDocument()
  })

  it("More opens a sheet with every section of the navigation", async () => {
    const { user } = renderWithProviders(<BottomNav items={items} more={nav} />, { route: "/timetable/" })

    await user.click(screen.getByRole("button", { name: "More" }))

    const sheet = await screen.findByRole("dialog")
    // next/link adds the trailing slash only when the app sets `trailingSlash` (the static apps do).
    expect(within(sheet).getByRole("link", { name: "Settings" }).getAttribute("href")).toMatch(/^\/settings\/?$/)
    expect(within(sheet).getByText("Academics")).toBeInTheDocument()
    expect(within(sheet).getByRole("link", { name: "Timetable" })).toHaveAttribute("aria-current", "page")
  })
})

describe("isActivePath", () => {
  it("ignores query strings and trailing slashes", () => {
    expect(isActivePath("/timetable", "/timetable/?week=2026-10-05")).toBe(true)
    expect(isActivePath("/", "/", "prefix")).toBe(true)
    expect(isActivePath("/lessons/view/", "/", "prefix")).toBe(false)
    expect(isActivePath("/grades/day/", "/grades/", "exact")).toBe(false)
  })
})

describe("filterNavGroups", () => {
  it("hides items by role and visibility and drops empty groups", () => {
    const groups: NavGroup[] = [
      { label: "Teaching", items: [{ title: "Journal", url: "/journal/", roles: ["teacher"] }] },
      { label: "My group", items: [{ title: "Students", url: "/group/", roles: ["teacher"], visible: false }] },
      { label: "Admin", items: [{ title: "Users", url: "/users/", roles: ["admin"] }] },
    ]

    const visible = filterNavGroups(groups, ["teacher"])

    expect(visible.map((group) => group.label)).toEqual(["Teaching"])
  })
})
