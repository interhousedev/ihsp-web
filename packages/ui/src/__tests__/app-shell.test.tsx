import { afterEach, describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { AppShell } from "../components/layout/app-shell"
import { PlatformMenu } from "../components/layout/platform-menu"
import { SidebarBrand } from "../components/layout/sidebar-brand"
import { SidebarProvider } from "../components/ui/sidebar"

const link = (key: "sp" | "lms", current: boolean) => ({
  key,
  name: `${key}.iht`,
  description: key,
  href: `https://${key}.test/`,
  current,
})

describe("SidebarBrand", () => {
  it("makes the logo a labelled toggle and keeps the name as the home link", async () => {
    const { user } = renderWithProviders(
      <SidebarProvider>
        <SidebarBrand name="my.iht" logo={<img alt="" src="/logo.svg" />} />
      </SidebarProvider>,
    )
    const toggle = screen.getByRole("button", { name: "Toggle the sidebar" })
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("link", { name: "my.iht" })).toHaveAttribute("href", "/")

    toggle.focus()
    await user.keyboard("{Enter}")

    expect(toggle).toHaveAttribute("aria-expanded", "false")
  })

  it("clips the logo to rounded corners", () => {
    const { container } = renderWithProviders(
      <SidebarProvider>
        <SidebarBrand name="my.iht" logo={<img alt="" src="/logo.svg" />} />
      </SidebarProvider>,
    )
    expect(container.querySelector("img")?.parentElement).toHaveClass("overflow-hidden", "rounded-lg")
  })
})

function renderShell(width: number) {
  window.innerWidth = width
  return renderWithProviders(
    <AppShell
      nav={[{ items: [{ title: "Today", url: "/", icon: "home" }] }]}
      platforms={[link("sp", true), link("lms", false)]}
      brand={<span>brand</span>}
      history={<span>history</span>}
      search={<span>search</span>}
      sidebarSlot={<span>slot</span>}
      ai={<span>assistant</span>}
      bell={<span>bell</span>}
      tools={<span>tools</span>}
      settingsHref="/settings/"
      profile={<span>avatar</span>}
      sidebarFooter={<span>account</span>}
    >
      <p>page</p>
    </AppShell>,
  )
}

describe("AppShell from 768 px", () => {
  afterEach(() => {
    window.innerWidth = 1024
  })

  it("has no top toolbar: the sidebar holds history, search, the slot, the nav, the bottom menu and the account", () => {
    const { container } = renderShell(1024)
    expect(container.querySelector('[data-slot="shell-controls"]')).toBeNull()
    expect(container.querySelector("header")).toBeNull()
    const sidebar = container.querySelector<HTMLElement>('[data-slot="sidebar"]') as HTMLElement

    const toolbar = within(sidebar).getByText("history").closest('[data-slot="sidebar-toolbar"]') as HTMLElement
    expect(within(toolbar).getByText("search")).toBeInTheDocument()
    expect(within(sidebar).getByText("slot")).toBeInTheDocument()
    const menu = sidebar.querySelector<HTMLElement>('[data-slot="sidebar-bottom-menu"]') as HTMLElement
    for (const text of ["bell", "assistant", "tools"]) expect(within(menu).getByText(text)).toBeInTheDocument()
    expect(within(menu).getByRole("link", { name: "Settings" }).getAttribute("href")).toContain("settings")
    expect(within(sidebar).getByText("account")).toBeInTheDocument()
    expect(within(sidebar).queryByText("avatar")).not.toBeInTheDocument()

    // Top to bottom: toolbar, slot, nav, bottom menu, account.
    const order = ["history", "slot", "Today", "bell", "account"].map((text) =>
      Array.from(sidebar.querySelectorAll("*")).findIndex(
        (node) => node.children.length === 0 && node.textContent === text,
      ),
    )
    expect([...order].sort((x, y) => x - y)).toEqual(order)
  })

  it("puts the app switcher beside the brand", async () => {
    const { user, container } = renderShell(1024)
    const header = container.querySelector<HTMLElement>('[data-slot="sidebar-header"]') as HTMLElement
    await user.click(within(header).getByRole("button", { name: "IHT platforms" }))
    expect(await screen.findByRole("menuitem", { name: /lms\.iht/ })).toBeInTheDocument()
  })
})

describe("AppShell on phones", () => {
  afterEach(() => {
    window.innerWidth = 1024
  })

  it("keeps the compact top bar with history, tools, search, assistant, bell and avatar", () => {
    const { container } = renderShell(375)
    const controls = container.querySelector<HTMLElement>('[data-slot="shell-controls"]') as HTMLElement
    expect(controls).toHaveClass("fixed", "glass")
    for (const text of ["history", "tools", "search", "assistant", "bell", "avatar"]) {
      expect(within(controls).getByText(text)).toBeInTheDocument()
    }
    expect(container.querySelector('[data-slot="sidebar-toolbar"]')).toBeNull()
    expect(container.querySelector('[data-slot="sidebar-bottom-menu"]')).toBeNull()
  })
})

describe("PlatformMenu", () => {
  it("lists every platform as one tile and marks the current one", async () => {
    const { user } = renderWithProviders(<PlatformMenu platforms={[link("sp", true), link("lms", false)]} />)

    await user.click(screen.getByRole("button", { name: "IHT platforms" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /lms\.iht/ })).toHaveAttribute("href", "https://lms.test/")
    expect(within(menu).getByRole("menuitem", { name: /sp\.iht/ })).toHaveAttribute("aria-current", "page")
    for (const key of ["sp", "lms"]) {
      const tile = within(menu).getByTestId(`platform-icon-${key}`)
      expect(tile.querySelector("svg")).not.toBeNull()
      expect(tile).toHaveClass("size-9", "rounded-lg")
    }
  })

  it("renders nothing when there is nowhere else to go", () => {
    renderWithProviders(<PlatformMenu platforms={[link("sp", true)]} />)
    expect(screen.queryByRole("button", { name: "IHT platforms" })).not.toBeInTheDocument()
  })
})
