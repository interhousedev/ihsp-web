import type { Excuse, ExcuseTemplate } from "@ihsp/api"

type BadgeVariant = "default" | "secondary" | "outline" | "destructive"

/** Statuses the UI has a label for; Unknown values fall back to the raw value. */
export const KNOWN_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const
export const KNOWN_ORIGINS = ["request", "curator"] as const

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
}

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANT[status] ?? "outline"
}

export function isKnownStatus(status: string): boolean {
  return (KNOWN_STATUSES as readonly string[]).includes(status)
}

export function isKnownOrigin(origin: string): boolean {
  return (KNOWN_ORIGINS as readonly string[]).includes(origin)
}

/** The template title in the user's language; falls back to uz, ru, en, then the code. */
export function templateTitle(template: ExcuseTemplate | null, locale: string): string {
  if (!template) return ""
  const { title } = template
  return title[locale] ?? title.uz ?? title.ru ?? title.en ?? template.code
}

/** The student can withdraw a pending request or an approved one that was requested by the student. */
export function canCancel(excuse: Pick<Excuse, "status" | "origin">): boolean {
  return excuse.status === "pending" || (excuse.status === "approved" && excuse.origin === "request")
}
