import { api, queryOptions, seg } from "@ihsp/api"

// Typed adapter for `/v1/admin/lms/level-schemes*`: the endpoints are in the OpenAPI document but have no function in `@ihsp/api` yet.

export type LocalizedName = Record<string, string>

export type LevelTier = {
  level_from: number
  title: LocalizedName
  color: string
  icon: string
  reward_badge_id?: string | null
}

export type LevelCurve = { kind: "quadratic" | "table"; base?: number | null; steps?: number[] | null }

export type LevelScheme = {
  id: string
  name: LocalizedName
  active: boolean
  scope: "platform" | "course"
  course_id: string | null
  curve: LevelCurve
  tiers: LevelTier[]
}

/** Learners per level (the key is the level) under the live scheme and under the previewed one. */
export type LevelPreview = { before: Record<string, number>; after: Record<string, number> }

export type PlatformBadgeOption = { id: string; name: LocalizedName }

export const levelKeys = {
  schemes: () => ["admin", "lms", "level-schemes"] as const,
  preview: (id: string) => ["admin", "lms", "level-schemes", id, "preview"] as const,
  badges: () => ["admin", "lms", "level-reward-badges"] as const,
}

export const getLevelSchemesQuery = () =>
  queryOptions({
    queryKey: levelKeys.schemes(),
    queryFn: ({ signal }) => api.get<{ items: LevelScheme[] }>("/v1/admin/lms/level-schemes", { signal }),
  })

export const getLevelPreviewQuery = (id: string) =>
  queryOptions({
    queryKey: levelKeys.preview(id),
    queryFn: ({ signal }) => api.get<LevelPreview>(`/v1/admin/lms/level-schemes/${seg(id)}/preview`, { signal }),
  })

/** Platform badges that can reward a rank. */
export const getRewardBadgesQuery = () =>
  queryOptions({
    queryKey: levelKeys.badges(),
    queryFn: ({ signal }) => api.get<{ items: PlatformBadgeOption[] }>("/v1/admin/lms/badges", { signal }),
  })

export function createLevelScheme(body: {
  name: LocalizedName
  curve: LevelCurve
  scope: "platform"
}): Promise<LevelScheme> {
  return api.post<LevelScheme>("/v1/admin/lms/level-schemes", body)
}

export function putLevelTiers(id: string, tiers: LevelTier[]): Promise<LevelScheme> {
  return api.put<LevelScheme>(`/v1/admin/lms/level-schemes/${seg(id)}/tiers`, { tiers })
}

export function activateLevelScheme(id: string): Promise<LevelScheme> {
  return api.post<LevelScheme>(`/v1/admin/lms/level-schemes/${seg(id)}:activate`)
}
