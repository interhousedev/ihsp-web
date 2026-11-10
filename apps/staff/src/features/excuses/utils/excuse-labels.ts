import type { Excuse, ExcuseTemplate } from "@ihsp/api"
import type { StatusTone } from "@ihsp/ui"

export const STATUS_TONE: Record<string, StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "neutral",
  revoked: "neutral",
}

/** The template title in the interface language (uz, ru, en), the code when the backend sent no title. */
export function templateTitle(template: ExcuseTemplate | null, locale: string): string {
  if (!template) return ""
  const titles: Record<string, string | undefined> = template.title
  return titles[locale] ?? titles.en ?? template.code
}

export function isOpen(excuse: Excuse): boolean {
  return excuse.status === "approved" || excuse.status === "pending"
}
