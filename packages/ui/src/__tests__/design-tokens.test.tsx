import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderWithProviders } from "@ihsp/test-utils"
import { render, screen, within } from "@testing-library/react"
import { BottomNav } from "../components/layout/bottom-nav"
import { PageContainer } from "../components/layout/page-container"
import { PageHeader } from "../components/layout/page-header"
import type { BottomNavItem, NavGroup } from "../components/layout/nav-types"
import { MarkBadge, markToneClass } from "../components/mark-badge"
import { StatusBadge } from "../components/status-badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { cn } from "../lib/utils"

describe("semantic tones", () => {
  it("StatusBadge uses the tone tokens and a registry icon", () => {
    render(<StatusBadge tone="success" label="Done" icon="check" />)
    const badge = screen.getByText("Done")
    expect(badge.className).toContain("bg-success-muted")
    expect(badge.getAttribute("data-tone")).toBe("success")
    expect(badge.querySelector("svg")).not.toBeNull()
  })

  it("MarkBadge maps 5..2 onto the --mark-* tokens", () => {
    render(<MarkBadge mark={2} />)
    expect(screen.getByText("2").className).toContain("text-mark-2")
    expect(markToneClass(4.6)).toContain("bg-mark-5-muted")
    expect(markToneClass(3)).toContain("text-mark-3")
  })
})

describe("shapes", () => {
  it("Card uses the card radius token and still accepts an override", () => {
    const { container } = render(<Card className="rounded-none">x</Card>)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain("rounded-none")
    expect(card.className).not.toContain("rounded-card")
    expect(cn("rounded-card", "rounded-lg")).toBe("rounded-lg")
  })

  it("Button keeps the theme radius by default and is fully round with shape=pill", () => {
    render(
      <>
        <Button>Plain</Button>
        <Button shape="pill">Pill</Button>
      </>,
    )
    expect(screen.getByRole("button", { name: "Plain" }).className).toContain("rounded-lg")
    expect(screen.getByRole("button", { name: "Pill" }).className).toContain("rounded-full")
    expect(screen.getByRole("button", { name: "Pill" }).className).not.toContain("rounded-lg")
  })
})

describe("PageHeader", () => {
  it("renders the title, back slot and actions; PageContainer uses it", () => {
    render(
      <PageHeader
        title="Grades"
        back={<button type="button">Back</button>}
        actions={<button type="button">Export</button>}
      />,
    )
    expect(screen.getByRole("heading", { level: 1, name: "Grades" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument()
  })

  it("PageContainer renders its title through PageHeader", () => {
    const { container } = render(<PageContainer title="Homework">body</PageContainer>)
    expect(container.querySelector('[data-slot="page-header"] h1')?.textContent).toBe("Homework")
  })
})

describe("BottomNav for a user-chosen bar", () => {
  const items: BottomNavItem[] = [{ title: "Today", url: "/", icon: "home", match: "exact" }]
  const nav: NavGroup[] = [
    {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/", icon: "home" },
        { title: "Grades", url: "/grades/", icon: "grades" },
      ],
    },
  ]

  it("drops the pages already in the bar from More and sets the test id", async () => {
    const { user } = renderWithProviders(
      <BottomNav items={items} more={nav} excludeVisibleFromMore testId="mobile-tab-bar" />,
      { route: "/grades/" },
    )
    expect(screen.getByTestId("mobile-tab-bar")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "More" }))
    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByRole("link", { name: "Grades" })).toHaveAttribute("aria-current", "page")
    expect(within(sheet).queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument()
  })
})

describe("light-mode contrast of status text", () => {
  const css = readFileSync(resolve(import.meta.dir, "../styles/theme.css"), "utf8")
  const light = css.slice(css.indexOf(":where(:root)"), css.indexOf(":where(.dark)"))
  const token = (name: string) => {
    const match = new RegExp(`--${name}: oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`).exec(light)
    if (!match) throw new Error(`no ${name}`)
    return [Number(match[1]), Number(match[2]), Number(match[3])] as const
  }
  // OKLCH → linear sRGB → relative luminance (WCAG).
  const luminance = ([l, c, h]: readonly [number, number, number]) => {
    const a = c * Math.cos((h * Math.PI) / 180)
    const b = c * Math.sin((h * Math.PI) / 180)
    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
    const clamp = (v: number) => Math.min(1, Math.max(0, v))
    const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)
    const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)
    const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const ratio = (x: number, y: number) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  const white = 1

  for (const tone of ["success", "warning", "info"]) {
    it(`${tone} text reaches 4.5:1 on its muted background and on white`, () => {
      const text = luminance(token(tone))
      expect(ratio(text, luminance(token(`${tone}-muted`)))).toBeGreaterThanOrEqual(4.5)
      expect(ratio(text, white)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
