import type { DashboardWidgetKind } from "@ihsp/api";
import { Icons } from "@ihsp/ui";
import type { ComponentType } from "react";
import { WIDGET_KINDS } from "./model";

type CatalogEntry = {
  kind: DashboardWidgetKind;
  icon: ComponentType<{ className?: string }>;
};

const ICONS: Record<DashboardWidgetKind, CatalogEntry["icon"]> = {
  timetable: Icons.calendar,
  homework: Icons.journal,
  marks: Icons.check,
  exams: Icons.calendarEvent,
  flashcards_due: Icons.flashcards,
  notebook_prompt: Icons.chat,
  attendance: Icons.checks,
  clock_next_lesson: Icons.clock,
};

/** The widgets a student can add; the titles are `today.dashboard.kinds.<kind>`. */
export const WIDGET_CATALOG: readonly CatalogEntry[] = WIDGET_KINDS.map(
  (kind) => ({
    kind,
    icon: ICONS[kind],
  }),
);
