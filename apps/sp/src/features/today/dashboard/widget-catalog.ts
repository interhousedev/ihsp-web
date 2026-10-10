import type { DashboardWidgetKind } from "@ihsp/api"
import { Icons } from "@ihsp/ui"
import type { ComponentType } from "react"
import { WIDGET_GROUPS } from "./model"

type CatalogEntry = {
  kind: DashboardWidgetKind
  icon: ComponentType<{ className?: string }>
}

const ICONS: Record<DashboardWidgetKind, CatalogEntry["icon"]> = {
  timetable: Icons.calendar,
  homework: Icons.journal,
  marks: Icons.check,
  exams: Icons.calendarEvent,
  flashcards_due: Icons.flashcards,
  notebook_prompt: Icons.chat,
  attendance: Icons.checks,
  clock_next_lesson: Icons.clock,
  upcoming_controls: Icons.calendarEvent,
  next_lesson: Icons.clock,
  today_lessons: Icons.calendar,
  semester_summary: Icons.trendingUp,
  announcements: Icons.chat,
  new_marks: Icons.check,
  alerts: Icons.warning,
  get_started: Icons.circleCheck,
}

/** The widgets a student can add, by group; the titles are `today.dashboard.kinds.<kind>` and `groups.<id>`. */
export const WIDGET_CATALOG: readonly {
  id: (typeof WIDGET_GROUPS)[number]["id"]
  entries: readonly CatalogEntry[]
}[] = WIDGET_GROUPS.map(({ id, kinds }) => ({
  id,
  entries: kinds.map((kind) => ({ kind, icon: ICONS[kind] })),
}))
