// Dashboard widgets (backend module dashboard).

export type DashboardWidgetKind =
  | "timetable"
  | "homework"
  | "marks"
  | "exams"
  | "flashcards_due"
  | "notebook_prompt"
  | "attendance"
  | "clock_next_lesson"

/** Columns x rows on a 4-column grid (2 columns on a phone). */
export type DashboardWidgetSize = "1x1" | "1x2" | "2x1" | "2x2" | "2x4"

export type DashboardWidget = {
  id: string
  kind: DashboardWidgetKind
  size: DashboardWidgetSize
  x: number
  y: number
  /** `#rrggbb`, or null for the default tile. */
  color: string | null
  config: Record<string, string>
  /** Black or white, whichever reads better on `color` (WCAG contrast of at least 4.5 for the tints offered). */
  text_color: string | null
}

/** Version 0 is the default layout that was never saved. */
export type Dashboard = { version: number; widgets: DashboardWidget[] }

export type DashboardSaveBody = {
  version: number
  widgets: Omit<DashboardWidget, "text_color">[]
}
