import type { LinkItem } from "@ihsp/api"

/** Filter chips cover the kinds sp shows today; `artifact` has no chip or label yet. */
export type LinkKindFilter = "all" | Exclude<LinkItem["kind"], "artifact">

export const KIND_FILTERS = ["all", "url", "file", "chat", "flashcard_set"] as const satisfies readonly LinkKindFilter[]

export type LinkStatus = "active" | "revoked" | "disabled" | "expired"

/** Why a link no longer works, or `active` (SL-7, SHR-6). */
export function linkStatus(link: LinkItem, now: number = Date.now()): LinkStatus {
  if (link.disabled) return "disabled"
  if (link.revoked_at !== null) return "revoked"
  if (link.expires_at !== null && Date.parse(link.expires_at) <= now) return "expired"
  return "active"
}

/** Name shown in the list: the title, the file name, the target address or the short ID. */
export function linkName(link: LinkItem): string {
  return link.title ?? link.file?.name ?? link.target_url ?? link.slug
}

/** Shares (chats, flash card sets) are revoked; short links are deleted (UF-WEB-26). */
export function isShare(link: LinkItem): boolean {
  return link.kind === "chat" || link.kind === "flashcard_set"
}

export function canRevoke(link: LinkItem, now?: number): boolean {
  return isShare(link) && linkStatus(link, now) === "active"
}

/** Lesson attachments are managed on their lesson page, not here. */
export function canDelete(link: LinkItem): boolean {
  return !isShare(link) && link.lesson_id === null
}

/** Only `http` and `https` addresses can be shortened (SL-1). */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
