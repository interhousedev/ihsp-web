import { describe, expect, it } from "bun:test"
import { renderWithProviders as render } from "@ihsp/test-utils"
import { kbLibrary } from "./library"
import { OpenUiBlock } from "./open-ui-block"

const button = 'root = Stack([LinkList([{title: "Go", url: "/chooser/search/"}])])'
const callout = 'root = Card("Heads up", [TextBlock("Body")], "ℹ")'

describe("ADM-OUI-FIX kb block look", () => {
  it("ADM-OUI-FIX-1 the button block renders a link with button styling", () => {
    const { container } = render(<OpenUiBlock code={button} library={kbLibrary} links="kb" />)
    const a = container.querySelector("a")
    expect(a?.textContent).toBe("Go")
    expect(a?.className).toContain("bg-primary")
  })

  it("ADM-OUI-FIX-2 the callout icon and title share one row", () => {
    const { container } = render(<OpenUiBlock code={callout} library={kbLibrary} links="kb" />)
    const row = container.querySelector('[data-slot="openui-card-heading"]')
    expect(row?.textContent).toContain("ℹ")
    expect(row?.textContent).toContain("Heads up")
  })
})
