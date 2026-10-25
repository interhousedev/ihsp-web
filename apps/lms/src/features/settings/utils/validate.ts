import type { CourseSettingsView } from "@ihsp/api"
import { isHexColor } from "./color"

export const SUMMARY_MAX = 200
export const LIST_LIMITS = {
  tags: [10, 32],
  outcomes: [12, 200],
  requirements: [12, 200],
  audience: [12, 200],
} as const

export type SettingsField =
  | "accent_color"
  | "summary"
  | "workload_hours_per_week"
  | "duration_weeks"
  | "tags"
  | "outcomes"
  | "requirements"
  | "audience"
  | "enrolment_ends_at"

export type SettingsErrors = Partial<Record<SettingsField, "hex" | "length" | "range" | "count" | "dates">>

/** Client-side checks that mirror the backend (`422 lms/settings-invalid`), so most mistakes show before saving. */
export function validateSettings(values: CourseSettingsView): SettingsErrors {
  const errors: SettingsErrors = {}
  if (values.accent_color && !isHexColor(values.accent_color)) errors.accent_color = "hex"
  if ((values.summary ?? "").length > SUMMARY_MAX) errors.summary = "length"
  const w = values.workload_hours_per_week
  if (w !== null && (!Number.isInteger(w) || w < 1 || w > 40)) errors.workload_hours_per_week = "range"
  const d = values.duration_weeks
  if (d !== null && (!Number.isInteger(d) || d < 1 || d > 52)) errors.duration_weeks = "range"
  for (const key of ["tags", "outcomes", "requirements", "audience"] as const) {
    const [count, length] = LIST_LIMITS[key]
    if (values[key].length > count || values[key].some((item) => item.length > length)) errors[key] = "count"
  }
  const { enrolment_starts_at: from, enrolment_ends_at: to } = values
  if (from && to && new Date(to).getTime() < new Date(from).getTime()) errors.enrolment_ends_at = "dates"
  return errors
}

/** The fields whose value differs from `base`, as a body for `PATCH .../settings/details`. */
export function changedFields(base: CourseSettingsView, next: CourseSettingsView): Partial<CourseSettingsView> {
  const body: Record<string, unknown> = {}
  const writable = [
    "code",
    "friendly_name",
    "summary",
    "cover_file_id",
    "banner_file_id",
    "accent_color",
    "language",
    "level",
    "workload_hours_per_week",
    "duration_weeks",
    "tags",
    "outcomes",
    "requirements",
    "audience",
    "audience_scope",
    "audience_group_ids",
    "enrolment_open",
    "enrolment_starts_at",
    "enrolment_ends_at",
    "navigation",
  ] as const
  for (const key of writable) {
    if (JSON.stringify(base[key]) !== JSON.stringify(next[key])) body[key] = next[key]
  }
  return body as Partial<CourseSettingsView>
}

const pad = (n: number) => String(n).padStart(2, "0")

/** ISO instant to the value of `<input type="datetime-local">` (local time) and back. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}

export function moveItem<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta
  if (target < 0 || target >= items.length) return [...items]
  const copy = [...items]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item as T)
  return copy
}
