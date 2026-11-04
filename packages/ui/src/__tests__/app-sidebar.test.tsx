import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { AppSidebar } from "../components/layout/app-sidebar"
import type { NavGroup } from "../components/layout/nav-types"
import { SidebarProvider } from "../components/ui/sidebar"

const nav: NavGroup[] = [
  {
    label: "Academics",
    items: [
      { title: "Today", url: "/", icon: "home", match: "exact" },
      {
        title: "Library",
        url: "/library/",
        icon: "files",
        items: [{ title: "Catalogue", url: "/library/catalogue/" }],
      },
    ],
  },
  { label: "Account", items: [{ title: "Settings", url: "/settings/", icon: "settings" }] },
]

function renderSidebar(open: boolean) {
  return renderWithProviders(
    <SidebarProvider open={open} onOpenChange={() => undefined}>
      <AppSidebar nav={nav} brand={<span>Brand</span>} />
    </SidebarProvider>,
  )
}

/** The visible order of the sidebar: group labels and row labels, and whether each row starts with its icon. */
function layout(container: HTMLElement) {
  const sidebar = container.querySelector('[data-slot="sidebar"]')
  const rows = Array.from(container.querySelectorAll('[data-sidebar="menu-button"]'))
  const groups = Array.from(container.querySelectorAll('[data-sidebar="group-label"]'))
  return {
    state: sidebar?.getAttribute("data-state"),
    groups: groups.map((group) => group.textContent),
    rows: rows.map((row) => ({
      label: row.querySelector("span")?.textContent ?? "",
      iconFirst: row.firstElementChild?.tagName.toLowerCase() === "svg",
    })),
  }
}

describe("AppSidebar geometry", () => {
  it("keeps the same section order, rows and icon positions when collapsed", () => {
    const expanded = renderSidebar(true)
    const expandedLayout = layout(expanded.container)
    expanded.unmount()

    const collapsed = renderSidebar(false)
    const collapsedLayout = layout(collapsed.container)

    expect(expandedLayout.state).toBe("expanded")
    expect(collapsedLayout.state).toBe("collapsed")
    expect(collapsedLayout.groups).toEqual(expandedLayout.groups)
    expect(collapsedLayout.rows.map((row) => row.label)).toEqual(expandedLayout.rows.map((row) => row.label))
    expect(collapsedLayout.rows.every((row) => row.iconFirst)).toBe(true)
    expect(expandedLayout.rows.every((row) => row.iconFirst)).toBe(true)
  })

  it("keeps the section labels in the DOM when collapsed so the rows keep their y position", () => {
    const { container } = renderSidebar(false)
    const labels = Array.from(container.querySelectorAll('[data-sidebar="group-label"]'))
    expect(labels.map((label) => label.textContent)).toEqual(["Academics", "Account"])
    for (const label of labels) {
      expect(label.querySelector("span")).toHaveClass("truncate")
    }
  })
})
