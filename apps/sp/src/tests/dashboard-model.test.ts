/** The Today dashboard model: packing, sizes, colour contrast and the layout merge. */
import { describe, expect, test } from "bun:test"
import type { DashboardWidget, DashboardWidgetKind, DashboardWidgetSize } from "@ihsp/api"
import {
  addWidget,
  colorWidget,
  contrastRatio,
  pack,
  removeWidget,
  resizeWidget,
  spanOf,
  textOn,
  WIDGET_SIZES,
  withTodayWidgets,
  type Widget,
} from "../features/today/dashboard/model"

let counter = 0

function widget(kind: DashboardWidgetKind, size: DashboardWidgetSize, extra: Partial<Widget> = {}): Widget {
  counter += 1
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
    kind,
    size,
    x: 0,
    y: 0,
    color: null,
    config: { layout: "2" },
    text_color: null,
    ...extra,
  }
}

function cells(widgets: readonly Widget[]): string[] {
  return widgets.flatMap((w) => {
    const { cols, rows } = spanOf(w.size)
    return Array.from({ length: cols * rows }, (_, i) => `${w.x + (i % cols)},${w.y + Math.floor(i / cols)}`)
  })
}

describe("dashboard packing", () => {
  test("pack places widgets without overlap in a 4-column grid, in the given order", () => {
    const packed = pack([
      widget("today_lessons", "2x2"),
      widget("homework", "2x1"),
      widget("semester_summary", "1x1"),
      widget("announcements", "2x4"),
    ])

    expect(new Set(cells(packed)).size).toBe(cells(packed).length)
    expect(packed.every((w) => w.x >= 0 && w.x + spanOf(w.size).cols <= 4)).toBe(true)
    expect(packed[0]).toMatchObject({ x: 0, y: 0 })
    expect(packed[1]).toMatchObject({ x: 2, y: 0 })
  })

  test("addWidget uses the first allowed size and appends at the end", () => {
    const added = addWidget([widget("next_lesson", "2x1")], "today_lessons")
    const last = added[added.length - 1]

    expect(last?.kind).toBe("today_lessons")
    expect(last?.size).toBe(WIDGET_SIZES.today_lessons[0])
  })

  test("removeWidget closes the gap it leaves", () => {
    const first = widget("next_lesson", "2x1")
    const second = widget("alerts", "2x1")
    const left = removeWidget([first, second], first.id)

    expect(left).toHaveLength(1)
    expect(left[0]).toMatchObject({ id: second.id, x: 0, y: 0 })
  })
})

describe("dashboard sizes", () => {
  test("resizeWidget accepts only a size the kind allows", () => {
    const w = widget("today_lessons", "2x2")

    expect(resizeWidget([w], w.id, "1x1")[0]?.size).toBe("2x2")
    expect(resizeWidget([w], w.id, "2x4")[0]?.size).toBe("2x4")
  })

  test("every kind has at least one size and the adaptive kinds take 1x1, 2x1 and 2x2", () => {
    for (const kind of ["upcoming_controls", "next_lesson", "semester_summary", "alerts"] as const) {
      expect(WIDGET_SIZES[kind]).toEqual(expect.arrayContaining(["1x1", "2x1", "2x2"]))
    }
  })
})

describe("dashboard colour", () => {
  test("colorWidget stores the readable text colour and clears it with the colour", () => {
    const w = widget("alerts", "2x1")
    const dark = colorWidget([w], w.id, "#007AFF")[0]
    expect(dark?.color).toBe("#007AFF")
    expect(dark?.text_color).toBe(textOn("#007AFF"))

    const cleared = colorWidget([dark as Widget], w.id, null)[0]
    expect(cleared?.text_color).toBeNull()
  })

  test("textOn picks the text with the higher contrast", () => {
    expect(contrastRatio("#FFFFFF", textOn("#FFFFFF"))).toBeGreaterThanOrEqual(4.5)
    expect(textOn("#1C1C1E")).toBe("#FFFFFF")
  })
})

describe("layout merge", () => {
  test("a layout without the mark gets every missing Today kind once, and is marked", () => {
    const legacy: DashboardWidget[] = [
      { ...widget("homework", "2x1"), config: {} },
      { ...widget("marks", "2x1"), config: {} },
    ]
    const merged = withTodayWidgets(legacy)
    const kinds = merged.map((w) => w.kind)

    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds).toEqual(expect.arrayContaining(["next_lesson", "upcoming_controls", "announcements", "get_started"]))
    expect(merged.every((w) => w.config.layout === "2")).toBe(true)
    expect(withTodayWidgets(merged)).toEqual(merged)
  })

  test("a marked layout keeps the widgets the student removed", () => {
    const marked = [widget("homework", "2x1")]
    expect(withTodayWidgets(marked)).toEqual(marked)
  })
})
