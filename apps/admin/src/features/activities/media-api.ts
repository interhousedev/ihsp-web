"use client"

import { activities, apiAbsoluteUrl } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useAdminMutation } from "../shared/hooks/use-admin-mutation"

export type MediaState = "reported" | "hidden"

export type MediaReport = { id: string; reason: string; status: string; isSubject: boolean; createdAt: string }
export type ReviewItem = {
  id: string
  clubId: string
  kind: string
  status: string
  caption: string | null
  hiddenSource: string | null
  thumbUrl: string | null
  originalUrl: string | null
  uploadedBy: string | null
  createdAt: string | null
  reports: MediaReport[]
}
export type MediaBlock = { id: string; userId: string; clubId: string | null; reason: string; createdAt: string }
export type MediaLimits = {
  usedBytes: number
  quotaBytes: number
  itemCount: number
  photoMaxBytes: number
  videoMaxBytes: number
  overridePhotoMaxBytes: number | null
  overrideVideoMaxBytes: number | null
  overrideQuotaBytes: number | null
}

const KEY = ["admin", "activities", "media"] as const
export const mediaQueueKey = [...KEY, "queue"] as const
export const mediaBlocksKey = [...KEY, "blocks"] as const
export const mediaLimitsKey = (clubId: string) => [...KEY, "limits", clubId] as const

const abs = (url: string | null | undefined) => (url ? apiAbsoluteUrl(url) : null)

export function useMediaQueue(state: MediaState, clubId?: string) {
  return useQuery({
    queryKey: [...mediaQueueKey, state, clubId ?? "all"],
    queryFn: async ({ signal }): Promise<{ items: ReviewItem[]; total: number }> => {
      const res = await activities.get(
        "/v1/admin/activities/media",
        { query: { state, club_id: clubId, limit: 100 } },
        { signal },
      )
      return {
        total: res.total,
        items: res.items.map(({ media: m, reports }) => ({
          id: m.id,
          clubId: m.club_id,
          kind: m.kind,
          status: m.status,
          caption: m.caption,
          hiddenSource: m.hidden_source,
          thumbUrl: abs(m.thumb_url ?? m.preview_url ?? m.poster_url),
          originalUrl: abs(m.original_url ?? m.video_url),
          uploadedBy: m.uploaded_by,
          createdAt: m.created_at,
          reports: reports.map((r) => ({
            id: r.id,
            reason: r.reason,
            status: r.status,
            isSubject: r.is_subject,
            createdAt: r.created_at,
          })),
        })),
      }
    },
  })
}

const queueInvalidate = [mediaQueueKey]

export function useRestoreMedia() {
  return useAdminMutation<{ id: string }, unknown>({
    mutationFn: ({ id }) =>
      activities.post("/v1/admin/activities/media/{media_id}:restore", { path: { media_id: id } }),
    invalidate: queueInvalidate,
  })
}

export function useHideMedia(onDone: () => void) {
  return useAdminMutation<{ id: string; reason: string }, unknown>({
    mutationFn: ({ id, reason }) =>
      activities.post("/v1/admin/activities/media/{media_id}:hide", { path: { media_id: id }, body: { reason } }),
    invalidate: queueInvalidate,
    onSuccess: onDone,
  })
}

export function useDeleteMedia(onDone: () => void) {
  return useAdminMutation<{ id: string }, unknown>({
    mutationFn: ({ id }) => activities.delete("/v1/admin/activities/media/{media_id}", { path: { media_id: id } }),
    invalidate: queueInvalidate,
    onSuccess: onDone,
  })
}

export function useResolveReport() {
  return useAdminMutation<{ id: string; uphold: boolean }, unknown>({
    mutationFn: ({ id, uphold }) =>
      uphold
        ? activities.post("/v1/admin/activities/media-reports/{report_id}:uphold", { path: { report_id: id } })
        : activities.post("/v1/admin/activities/media-reports/{report_id}:dismiss", { path: { report_id: id } }),
    invalidate: queueInvalidate,
  })
}

export function useMediaBlocks() {
  return useQuery({
    queryKey: mediaBlocksKey,
    queryFn: async ({ signal }): Promise<MediaBlock[]> =>
      (await activities.get("/v1/admin/activities/media-blocks", {}, { signal })).items.map((b) => ({
        id: b.id,
        userId: b.user_id,
        clubId: b.club_id,
        reason: b.reason,
        createdAt: b.created_at,
      })),
  })
}

export function useAddMediaBlock(onDone: () => void) {
  return useAdminMutation<{ userId: string; clubId: string | null; reason: string }, unknown>({
    mutationFn: ({ userId, clubId, reason }) =>
      activities.post("/v1/admin/activities/media-blocks", {
        body: { user_id: userId, club_id: clubId, reason },
      }),
    invalidate: [mediaBlocksKey],
    onSuccess: onDone,
  })
}

export function useRemoveMediaBlock() {
  return useAdminMutation<{ userId: string; clubId: string | null }, unknown>({
    mutationFn: ({ userId, clubId }) =>
      activities.delete("/v1/admin/activities/media-blocks/{user_id}", {
        path: { user_id: userId },
        query: { club_id: clubId ?? undefined },
      }),
    invalidate: [mediaBlocksKey],
  })
}

type UsageOut = {
  used_bytes: number
  quota_bytes: number
  item_count: number
  photo_max_bytes: number
  video_max_bytes: number
  override_photo_max_bytes: number | null
  override_video_max_bytes: number | null
  override_quota_bytes: number | null
}
const toLimits = (u: UsageOut): MediaLimits => ({
  usedBytes: u.used_bytes,
  quotaBytes: u.quota_bytes,
  itemCount: u.item_count,
  photoMaxBytes: u.photo_max_bytes,
  videoMaxBytes: u.video_max_bytes,
  overridePhotoMaxBytes: u.override_photo_max_bytes,
  overrideVideoMaxBytes: u.override_video_max_bytes,
  overrideQuotaBytes: u.override_quota_bytes,
})

export function useMediaLimits(clubId: string | null) {
  return useQuery({
    queryKey: mediaLimitsKey(clubId ?? ""),
    enabled: clubId !== null,
    queryFn: async ({ signal }) =>
      toLimits(
        await activities.get(
          "/v1/admin/activities/clubs/{club_id}/media-limits",
          { path: { club_id: clubId as string } },
          { signal },
        ),
      ),
  })
}

export type LimitsInput = { photoMaxBytes: number | null; videoMaxBytes: number | null; quotaBytes: number | null }

/** Saves per-club overrides; `null` input clears every override (back to the platform defaults). */
export function useSetMediaLimits(clubId: string) {
  return useAdminMutation<LimitsInput | null, unknown>({
    mutationFn: (input) =>
      input === null
        ? activities.delete("/v1/admin/activities/clubs/{club_id}/media-limits", { path: { club_id: clubId } })
        : activities.put("/v1/admin/activities/clubs/{club_id}/media-limits", {
            path: { club_id: clubId },
            body: {
              photo_max_bytes: input.photoMaxBytes,
              video_max_bytes: input.videoMaxBytes,
              quota_bytes: input.quotaBytes,
            },
          }),
    invalidate: [mediaLimitsKey(clubId)],
  })
}

const MB = 1024 * 1024
export const bytesToMb = (n: number) => Math.round((n / MB) * 10) / 10
/** Empty text means "no override"; anything else must be a positive number of megabytes. */
export function mbToBytes(text: string): number | null | "invalid" {
  const s = text.trim().replace(",", ".")
  if (s === "") return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? Math.round(n * MB) : "invalid"
}
