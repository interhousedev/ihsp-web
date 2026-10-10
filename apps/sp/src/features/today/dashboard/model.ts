import type { DashboardWidget, DashboardWidgetKind, DashboardWidgetSize } from "@ihsp/api"

/** The widget list as the editor changes it; `text_color` is recomputed on every colour change. */
export type Widget = DashboardWidget

export const COLUMNS = 4

/** Sizes each kind may take (columns x rows); the same table lives in the backend (`WIDGET_SIZES`). */
export const WIDGET_SIZES: Record<DashboardWidgetKind, readonly DashboardWidgetSize[]> = {
  timetable: ["2x1", "2x2", "2x4"],
  homework: ["1x1", "2x1", "2x2"],
  marks: ["1x1", "2x1", "2x2"],
  exams: ["1x1", "2x1", "2x2"],
  flashcards_due: ["1x1", "1x2", "2x1"],
  notebook_prompt: ["2x1", "2x2"],
  attendance: ["1x1", "2x1"],
  clock_next_lesson: ["1x1", "2x1", "2x2"],
  upcoming_controls: ["2x1", "1x1", "2x2"],
  next_lesson: ["2x1", "1x1", "2x2"],
  today_lessons: ["2x2", "2x1", "2x4"],
  semester_summary: ["1x1", "2x1", "2x2"],
  announcements: ["2x1", "2x2", "2x4"],
  new_marks: ["1x1", "2x1", "2x2"],
  alerts: ["2x1", "1x1", "2x2"],
  get_started: ["2x1", "2x2"],
}

/**
 * Kinds that repeat a card Today keeps: Up next (next lesson), Schedule (today's lessons) and Marks (semester).
 * They are not shown and not offered in the catalogue; a saved layout that still holds them is shown without them,
 * and the next save drops them.
 */
export const RETIRED_KINDS: readonly DashboardWidgetKind[] = ["clock_next_lesson", "timetable", "marks"]

/** The widgets Today shows: the saved ones minus the retired kinds. */
export function shownWidgets(widgets: readonly Widget[]): Widget[] {
  return widgets.filter((widget) => !RETIRED_KINDS.includes(widget.kind))
}

/** The catalogue groups (`today.dashboard.groups.<id>`) and the kinds in each; retired kinds are not listed. */
export const WIDGET_GROUPS: readonly {
  id: "study" | "control" | "news" | "tools"
  kinds: readonly DashboardWidgetKind[]
}[] = [
  {
    id: "study",
    kinds: ["next_lesson", "today_lessons", "homework", "semester_summary", "new_marks", "attendance"],
  },
  { id: "control", kinds: ["upcoming_controls", "exams", "alerts"] },
  { id: "news", kinds: ["announcements"] },
  {
    id: "tools",
    kinds: ["flashcards_due", "notebook_prompt", "get_started"],
  },
]

/** The kinds that replaced the fixed sections of Today; a layout saved before them gets them appended once. */
export const TODAY_KINDS: readonly DashboardWidgetKind[] = [
  "next_lesson",
  "upcoming_controls",
  "today_lessons",
  "semester_summary",
  "announcements",
  "new_marks",
  "alerts",
  "get_started",
]

/** Config entry every widget of a migrated layout carries (the backend default sets it too). */
export const LAYOUT_MARK = { key: "layout", value: "2" } as const

export const WIDGET_KINDS = Object.keys(WIDGET_SIZES) as DashboardWidgetKind[]

/** iOS-like tints offered by the colour picker; every one keeps a contrast of 4.5 or more with its text colour. */
export const PALETTE = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6", "#AF52DE", "#1C1C1E"] as const

export const MAX_WIDGETS = 24

export function spanOf(size: DashboardWidgetSize): {
  cols: number
  rows: number
} {
  const [cols, rows] = size.split("x").map(Number)
  return { cols: cols ?? 1, rows: rows ?? 1 }
}

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channel(Number.parseInt(color.slice(i, i + 2), 16)))
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

/** WCAG contrast ratio of two `#rrggbb` colours. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

/** Black or white text, whichever contrasts more with `background` (the same rule as the backend's `text_on`). */
export function textOn(background: string): "#000000" | "#FFFFFF" {
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#000000") ? "#FFFFFF" : "#000000"
}

/** Widgets in reading order (row, then column). */
export function inOrder(widgets: readonly Widget[]): Widget[] {
  return [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)
}

/** Lays the widgets out in the given order, each at the first free cell of a 4-column grid, and writes x and y. */
export function pack(widgets: readonly Widget[]): Widget[] {
  const taken = new Set<string>()
  return widgets.map((widget) => {
    const { cols, rows } = spanOf(widget.size)
    for (let y = 0; ; y++) {
      for (let x = 0; x + cols <= COLUMNS; x++) {
        const cells: string[] = []
        for (let dy = 0; dy < rows; dy++) for (let dx = 0; dx < cols; dx++) cells.push(`${x + dx},${y + dy}`)
        if (cells.every((cell) => !taken.has(cell))) {
          for (const cell of cells) taken.add(cell)
          return { ...widget, x, y }
        }
      }
    }
  })
}

function newId(): string {
  return crypto.randomUUID()
}

export function addWidget(widgets: readonly Widget[], kind: DashboardWidgetKind): Widget[] {
  if (widgets.length >= MAX_WIDGETS) return [...widgets]
  const size = WIDGET_SIZES[kind][0] ?? "1x1"
  const added: Widget = {
    id: newId(),
    kind,
    size,
    x: 0,
    y: 0,
    color: null,
    config: {},
    text_color: null,
  }
  return pack([...inOrder(widgets), added])
}

export function removeWidget(widgets: readonly Widget[], id: string): Widget[] {
  return pack(inOrder(widgets).filter((widget) => widget.id !== id))
}

/** Changes the size when the kind allows it; any other size is ignored. */
export function resizeWidget(widgets: readonly Widget[], id: string, size: DashboardWidgetSize): Widget[] {
  return pack(
    inOrder(widgets).map((widget) =>
      widget.id === id && WIDGET_SIZES[widget.kind].includes(size) ? { ...widget, size } : widget,
    ),
  )
}

export function colorWidget(widgets: readonly Widget[], id: string, color: string | null): Widget[] {
  return widgets.map((widget) =>
    widget.id === id ? { ...widget, color, text_color: color ? textOn(color) : null } : widget,
  )
}

/** Moves a widget to the place of another one (drag and drop, or the arrow keys). */
export function moveWidget(widgets: readonly Widget[], id: string, toIndex: number): Widget[] {
  const ordered = inOrder(widgets)
  const from = ordered.findIndex((widget) => widget.id === id)
  const moved = ordered[from]
  if (!moved) return [...widgets]
  ordered.splice(from, 1)
  ordered.splice(Math.max(0, Math.min(toIndex, ordered.length)), 0, moved)
  return pack(ordered)
}

/**
 * Migration on read: a layout saved before the Today sections became widgets gets the missing ones appended, once.
 * Every widget then carries `config.layout = "2"`, so later loads (and widgets the student removed) are left alone.
 * An empty saved layout stays empty.
 */
export function withTodayWidgets(widgets: readonly Widget[]): Widget[] {
  if (widgets.length === 0 || widgets.some((w) => w.config[LAYOUT_MARK.key] === LAYOUT_MARK.value)) return [...widgets]
  const mark = { [LAYOUT_MARK.key]: LAYOUT_MARK.value }
  const present = new Set(widgets.map((w) => w.kind))
  const marked = inOrder(widgets).map((w) => ({
    ...w,
    config: { ...w.config, ...mark },
  }))
  let result: Widget[] = marked
  for (const kind of TODAY_KINDS) {
    if (present.has(kind) || result.length >= MAX_WIDGETS) continue
    result = addWidget(result, kind).map((w) => (w.config[LAYOUT_MARK.key] ? w : { ...w, config: mark }))
  }
  return result
}

/** What the server stores: no computed text colour. */
export function toSaveBody(version: number, widgets: readonly Widget[]) {
  return {
    version,
    widgets: widgets.map(({ text_color: _text, ...widget }) => widget),
  }
}
