import type { Audience, BroadcastInput, BroadcastItem, Role } from "@ihsp/api"

export type MediaFile = { id: string; name: string }

export type BroadcastForm = {
  title: string
  text: string
  media: MediaFile[]
  audience: Audience
}

export const BROADCAST_ROLES: readonly Role[] = ["student", "teacher", "admin", "lms_admin"]
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const TITLE_MAX = 120
export const TEXT_MAX = 4000

export const EMPTY_AUDIENCE: Audience = { everyone: false, roles: [], group_ids: [], semesters: [] }

export function emptyBroadcastForm(): BroadcastForm {
  return { title: "", text: "", media: [], audience: EMPTY_AUDIENCE }
}

export function broadcastToForm(item: BroadcastItem): BroadcastForm {
  return {
    title: item.title,
    text: item.text,
    media: item.media_file_ids.map((id, index) => ({ id, name: `#${index + 1}` })),
    audience: { ...item.audience },
  }
}

export function formToInput(form: BroadcastForm): BroadcastInput {
  return {
    title: form.title.trim(),
    text: form.text.trim(),
    media_file_ids: form.media.map((file) => file.id),
    audience: form.audience,
  }
}

/** Someone must be addressed: everyone, or at least one role, group or semester. */
export function hasAudience(audience: Audience): boolean {
  return (
    audience.everyone || audience.roles.length > 0 || audience.group_ids.length > 0 || audience.semesters.length > 0
  )
}

export function isBroadcastValid(form: BroadcastForm): boolean {
  return form.title.trim() !== "" && form.text.trim() !== "" && hasAudience(form.audience)
}

/** Drafts and scheduled broadcasts can be edited; the rest are history. */
export function isEditable(item: Pick<BroadcastItem, "status"> | null): boolean {
  return item === null || item.status === "draft" || item.status === "scheduled"
}

const TASHKENT_OFFSET_HOURS = 5

/** `2026-10-09T10:00` typed in Asia/Tashkent (UTC+5, no daylight saving) to a UTC ISO string. */
export function tashkentLocalToIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!match) return null
  const [, year, month, day, hour, minute] = match.map(Number)
  const utc = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, (hour ?? 0) - TASHKENT_OFFSET_HOURS, minute ?? 0)
  return new Date(utc).toISOString()
}

/** The reverse: an ISO instant as `YYYY-MM-DDTHH:mm` in Asia/Tashkent, for a `datetime-local` input. */
export function isoToTashkentLocal(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + TASHKENT_OFFSET_HOURS * 3_600_000)
  return shifted.toISOString().slice(0, 16)
}

/** Wraps the selected text of `value` in an HTML tag pair; with no selection the tags surround a placeholder. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  open: string,
  close: string,
  placeholder: string,
): { text: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end) || placeholder
  const text = `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`
  return { text, selectionStart: start + open.length, selectionEnd: start + open.length + selected.length }
}
