import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { chatLibrary } from "./library"
import { MessageWithOpenUi } from "./message-with-open-ui"

const SAMPLE = `root = Stack([c, s, t, b, l, p, tt, ll, f])
c = Card("Card", [TextBlock("Hello https://example.com/very/long/path")], "Sub")
s = StatGrid([{label: "Avg", value: 4.5, hint: "h"}])
t = Table(["A", "B"], [["x", 1]], "Cap")
b = BarChart(["a", "b"], [1, 2], "Bars", "pts")
l = LineChart(["a", "b"], [1, 2], "Line")
p = Progress("Done", 3, 4)
tt = Timetable([{day: "Mon", time: "08:00", title: "Math", place: "101"}], "Week")
ll = LinkList([{title: "Site", url: "https://example.com"}], "Links")
f = Flow(["one", "two"], "Flow")`

function html(width: number) {
  window.innerWidth = width
  const { container } = renderWithProviders(
    <MessageWithOpenUi
      text={`\`\`\`openui\n${SAMPLE}\n\`\`\``}
      library={chatLibrary}
      renderMarkdown={(x) => <p>{x}</p>}
    />,
  )
  return container
}

describe("OPENUI-5 responsive layout", () => {
  for (const width of [360, 1280]) {
    it(`has no fixed pixel widths at ${width}px`, () => {
      const root = html(width)
      expect(root.querySelector("table")).not.toBeNull()
      for (const el of root.querySelectorAll("*")) {
        // recharts measures its own container and sets computed sizes inside the chart wrapper
        if (el.closest("[role=img]")) continue
        // Base UI renders a 1px visually-hidden helper span
        if ((el.getAttribute("style") ?? "").includes("clip-path")) continue
        const style = el.getAttribute("style") ?? ""
        expect(/width:\s*\d+(\.\d+)?px/.test(style)).toBe(false)
        expect(/(^|\s)(min-|max-)?w-\[\d+px\]/.test(el.getAttribute("class") ?? "")).toBe(false)
      }
    })

    it(`keeps tables in their own scroll container and links touch-sized at ${width}px`, () => {
      const root = html(width)
      expect(root.querySelector("table")?.parentElement?.className).toContain("overflow-x-auto")
      expect(root.querySelector("a")?.className).toContain("min-h-11")
      expect(root.querySelector("dl")?.className).toContain("grid-cols-2")
      expect(root.querySelector("ol")?.className).toContain("flex-wrap")
    })
  }

  for (const width of [360, 1280]) {
    it(`uses packages/ui components at ${width}px`, () => {
      const root = html(width)
      for (const slot of ["card", "table", "table-row", "table-cell", "progress", "progress-track"]) {
        expect(root.querySelector(`[data-slot=${slot}]`)).not.toBeNull()
      }
    })

    it(`has a table for desktop and stacked label: value cards for phones at ${width}px`, () => {
      const root = html(width)
      const table = root.querySelector("[data-slot=openui-table]")!
      expect(table.querySelector("table")?.closest(".hidden.md\\:block")).not.toBeNull()
      const cards = table.querySelector("ul.md\\:hidden")!
      expect(cards.querySelectorAll("[data-slot=card]")).toHaveLength(1)
      expect(cards.textContent).toContain("A:")
      expect(cards.textContent).toContain("B:")
    })
  }
})
