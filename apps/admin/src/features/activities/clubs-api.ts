"use client"

import { activities, apiAbsoluteUrl } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useAdminMutation } from "../shared/hooks/use-admin-mutation"

export type ClubStatus = "draft" | "pending_review" | "active" | "suspended" | "archived"
export type ClubCapability = "forms" | "drafting" | "points" | "roster"
export const CLUB_CAPABILITIES: readonly ClubCapability[] = ["forms", "drafting", "points", "roster"]

export type AdminClub = {
  id: string
  slug: string
  name: string
  status: ClubStatus
  ownerName: string | null
  memberCount: number
  logoUrl: string | null
}

const BASE = "/v1/admin/activities"
export const adminClubsKey = ["admin", "activities", "clubs"] as const
export const clubAnalyticsKey = ["admin", "activities", "analytics"] as const
export const clubCapabilitiesKey = (id: string) => ["admin", "activities", "club-capabilities", id] as const

/** A club name is plain text or a per-language map. */
export function nameOf(name: unknown): string {
  if (typeof name === "string") return name
  if (name && typeof name === "object") {
    const map = name as Record<string, unknown>
    const text = map.ru ?? map.en ?? map.uz ?? Object.values(map)[0]
    if (typeof text === "string") return text
  }
  return ""
}

export function useAdminClubs(status?: ClubStatus) {
  return useQuery({
    queryKey: [...adminClubsKey, status ?? "all"],
    queryFn: async ({ signal }): Promise<AdminClub[]> =>
      (await activities.get("/v1/admin/activities/clubs", { query: { status, limit: 100 } }, { signal })).items.map(
        (c) => ({
          id: c.id,
          slug: c.slug,
          name: nameOf(c.name),
          status: c.status as ClubStatus,
          ownerName: c.owner_name,
          memberCount: c.member_count,
          logoUrl: c.logo_url ? apiAbsoluteUrl(c.logo_url) : null,
        }),
      ),
  })
}

export function useClubAnalytics() {
  return useQuery({
    queryKey: clubAnalyticsKey,
    queryFn: ({ signal }) => activities.get("/v1/admin/activities/analytics", {}, { signal }),
  })
}

/** Capabilities currently enabled on one club (the list endpoint does not carry them). */
export function useClubCapabilities(id: string | null) {
  return useQuery({
    queryKey: clubCapabilitiesKey(id ?? ""),
    enabled: id !== null,
    queryFn: async ({ signal }): Promise<ClubCapability[]> =>
      (await activities.get("/v1/activities/clubs/{club_id}", { path: { club_id: id as string } }, { signal }))
        .capabilities ?? [],
  })
}

export function useReviewClub(onDone: () => void) {
  return useAdminMutation<{ id: string; approve: boolean; reason?: string }, unknown>({
    mutationFn: ({ id, approve, reason }) =>
      activities.post("/v1/admin/activities/clubs/{club_id}:review", {
        path: { club_id: id },
        body: { approve, reason: reason ?? null },
      }),
    invalidate: [adminClubsKey, clubAnalyticsKey],
    onSuccess: onDone,
  })
}

export function useSuspendClub(onDone: () => void) {
  return useAdminMutation<{ id: string; reason: string }, unknown>({
    mutationFn: ({ id, reason }) =>
      activities.post("/v1/admin/activities/clubs/{club_id}:suspend", { path: { club_id: id }, body: { reason } }),
    invalidate: [adminClubsKey, clubAnalyticsKey],
    onSuccess: onDone,
  })
}

export function useResumeClub() {
  return useAdminMutation<{ id: string }, unknown>({
    mutationFn: ({ id }) => activities.post("/v1/admin/activities/clubs/{club_id}:resume", { path: { club_id: id } }),
    invalidate: [adminClubsKey, clubAnalyticsKey],
  })
}

export function useForceTransferClub(onDone: () => void) {
  return useAdminMutation<{ id: string; toUserId: string }, unknown>({
    mutationFn: ({ id, toUserId }) =>
      activities.post("/v1/admin/activities/clubs/{club_id}:force-transfer", {
        path: { club_id: id },
        body: { to_user_id: toUserId },
      }),
    invalidate: [adminClubsKey],
    onSuccess: onDone,
  })
}

export function useSetCapabilities(onDone: () => void) {
  return useAdminMutation<{ id: string; capabilities: ClubCapability[] }, unknown>({
    mutationFn: ({ id, capabilities }) =>
      activities.put("/v1/admin/activities/clubs/{club_id}/capabilities", {
        path: { club_id: id },
        body: { capabilities },
      }),
    invalidate: [adminClubsKey],
    onSuccess: onDone,
  })
}

/** Number of club applications waiting for review (the badge of the Clubs tab). */
export function usePendingClubs(): number {
  return (useAdminClubs("pending_review").data ?? []).length
}

export type CreateClubInput = { name: string; slug: string; description: string; ownerUserId: string }

/** Creates a club that is already approved; the chosen user becomes its owner. */
export function useCreateClub(onDone: (club: { name: string }) => void) {
  return useAdminMutation<CreateClubInput, { name: unknown }>({
    mutationFn: ({ name, slug, description, ownerUserId }) =>
      activities.post("/v1/admin/activities/clubs", {
        body: { name, slug, description, owner_user_id: ownerUserId },
      }),
    invalidate: [adminClubsKey, clubAnalyticsKey],
    onSuccess: (club) => onDone({ name: nameOf(club.name) }),
  })
}
