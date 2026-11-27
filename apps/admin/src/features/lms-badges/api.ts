import { api, queryOptions, seg } from "@ihsp/api"
import type { BadgeIcon, BadgeShape } from "@ihsp/api"

// Typed adapter for `/v1/admin/lms/badges*` and `/v1/lms/badge-templates`: the admin routes have no function in `@ihsp/api` yet.

export type Labels = Record<string, string>

export type PlatformEvent = "level_reached" | "coach_resolved" | "courses_completed"
export const PLATFORM_EVENTS: readonly PlatformEvent[] = ["level_reached", "coach_resolved", "courses_completed"]

/** A platform rule: an aggregate event with a count (the only condition the backend accepts for the platform scope). */
export type PlatformRule = { event: PlatformEvent; condition: { op: "count_gte"; value: number } | null }

export type Design = { icon: BadgeIcon; shape: BadgeShape; color: string }

export type PlatformBadge = {
  id: string
  scope: "platform" | "course"
  course_id: string | null
  name: Labels
  description: Labels
  design: Design
  rule: { event?: string; condition?: { op?: string; value?: number } | null }
  template_code: string | null
  template_params: Record<string, unknown> | null
  enabled: boolean
  version: number
}

export type PlatformBadgeBody = { name: Labels; description: Labels; design: Design; rule: PlatformRule }

export type BadgeTemplate = {
  code: string
  scope: "platform" | "course"
  params: { name: string; min: number | null; max: number | null; default: number | string | null }[]
}

export const adminBadgeKeys = {
  list: () => ["admin", "lms", "badges"] as const,
  templates: () => ["admin", "lms", "badge-templates"] as const,
}

export const getPlatformBadgesQuery = () =>
  queryOptions({
    queryKey: adminBadgeKeys.list(),
    queryFn: ({ signal }) => api.get<{ items: PlatformBadge[] }>("/v1/admin/lms/badges", { signal }),
  })

export const getBadgeTemplatesQuery = () =>
  queryOptions({
    queryKey: adminBadgeKeys.templates(),
    queryFn: ({ signal }) => api.get<{ items: BadgeTemplate[] }>("/v1/lms/badge-templates", { signal }),
  })

export function createPlatformBadge(body: PlatformBadgeBody): Promise<PlatformBadge> {
  return api.post<PlatformBadge>("/v1/admin/lms/badges", body)
}

export function patchPlatformBadge(
  id: string,
  body: Partial<PlatformBadgeBody> & { enabled?: boolean },
): Promise<PlatformBadge> {
  return api.patch<PlatformBadge>(`/v1/admin/lms/badges/${seg(id)}`, body)
}

export function deletePlatformBadge(id: string): Promise<void> {
  return api.delete<void>(`/v1/admin/lms/badges/${seg(id)}`)
}
