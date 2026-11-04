import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { AppShell } from "../components/layout/app-shell"
import { PlatformMenu } from "../components/layout/platform-menu"
import { SidebarBrand } from "../components/layout/sidebar-brand"
import { SidebarProvider } from "../components/ui/sidebar"

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

describe("AppShell controls", () => {
  it("floats the controls with no full-width header or top bar toggle", () => {
    const { container } = renderWithProviders(
      <AppShell nav={[]} controlsLeading={<span>history</span>} controls={<span>search</span>}>
        <p>page</p>
      </AppShell>,
    )
    const controls = container.querySelector<HTMLElement>('[data-slot="shell-controls"]')
    expect(controls).toHaveClass("fixed", "glass")
    expect(within(controls as HTMLElement).getByText("history")).toBeInTheDocument()
    expect(within(controls as HTMLElement).getByText("search")).toBeInTheDocument()
    expect(container.querySelector("header")).toBeNull()
    expect(container.querySelector('[data-sidebar="trigger"]')).toBeNull()
  })
})

describe("PlatformMenu", () => {
  const link = (key: "sp" | "lms", current: boolean) => ({
    key,
    name: `${key}.iht`,
    description: key,
    href: `https://${key}.test/`,
    current,
  })

  it("lists only the other platforms", async () => {
    const { user } = renderWithProviders(<PlatformMenu platforms={[link("sp", true), link("lms", false)]} />)

    await user.click(screen.getByRole("button", { name: "IHT platforms" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /lms\.iht/ })).toHaveAttribute("href", "https://lms.test/")
    expect(within(menu).queryByRole("menuitem", { name: /sp\.iht/ })).not.toBeInTheDocument()
  })

  it("renders nothing when there is nowhere else to go", () => {
    renderWithProviders(<PlatformMenu platforms={[link("sp", true)]} />)
    expect(screen.queryByRole("button", { name: "IHT platforms" })).not.toBeInTheDocument()
  })
})
