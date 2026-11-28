"use client"

import { apiAbsoluteUrl, sha256Base64 } from "@ihsp/api"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { activitiesApi, type ClubMedia, type EventPatch } from "./api/activities-api"

/** Photos and videos the browser may send; the backend checks the real type again. */
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
/** An announcement carries at most this many photos (`IHSP_ACTIVITIES__MEDIA_ANNOUNCEMENT_PHOTOS_MAX`). */
export const ANNOUNCEMENT_PHOTOS_MAX = 10

const albumKey = (eventId: string) => ["activities", "event", eventId, "album"] as const
const mediaKey = (albumId: string) => ["activities", "album", albumId, "media"] as const

/** Signed media path → absolute URL on the API host (null stays null). */
export const mediaUrl = (path: string | null | undefined): string | null => (path ? apiAbsoluteUrl(path) : null)

/** The event's album; `null` until an organizer creates it. */
export function useEventAlbum(eventId: string | null) {
  return useQuery({
    queryKey: albumKey(eventId ?? ""),
    queryFn: () => activitiesApi.eventAlbum(eventId ?? ""),
    enabled: !!eventId,
  })
}

/** Media of one album, newest pages appended (`next_cursor`). */
export function useAlbumMedia(albumId: string | null) {
  return useInfiniteQuery({
    queryKey: mediaKey(albumId ?? ""),
    queryFn: ({ pageParam }) => activitiesApi.albumMedia(albumId ?? "", pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
    enabled: !!albumId,
    // Items stay `processing` for a few seconds after upload: refresh until they are ready.
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) => p.items.some((m) => m.status !== "ready" && m.status !== "failed"))
        ? 4000
        : false,
  })
}

/** One media item, used for event covers (signed thumbnail URL). */
export function useMedia(mediaId: string | null | undefined) {
  return useQuery({
    queryKey: ["activities", "media", mediaId],
    queryFn: () => activitiesApi.media(mediaId ?? ""),
    enabled: !!mediaId,
    staleTime: 10 * 60_000,
    retry: false,
  })
}

/**
 * Uploads one file: `POST /clubs/{id}/media:request-upload` → `PUT` the bytes to the presigned URL →
 * `POST /media/{id}:complete`. Returns the media row (still `processing`).
 */
export async function uploadClubMedia(
  clubId: string,
  file: File,
  opts: { albumId?: string | null; consentAttested: boolean },
): Promise<ClubMedia> {
  const started = await activitiesApi.requestUpload(clubId, {
    name: file.name,
    size: file.size,
    content_type: file.type || "application/octet-stream",
    sha256_b64: await sha256Base64(file),
    consent_attested: opts.consentAttested,
    album_id: opts.albumId ?? null,
  })
  const put = await fetch(started.upload.url, {
    method: started.upload.method,
    headers: started.upload.headers,
    body: file,
  })
  if (!put.ok) throw new Error(`upload failed: HTTP ${put.status}`)
  return activitiesApi.completeMedia(started.media.id)
}

export function useAlbumActions(eventId: string, albumId: string | null) {
  const qc = useQueryClient()
  const refreshAlbum = () => qc.invalidateQueries({ queryKey: albumKey(eventId) })
  const refreshMedia = () => qc.invalidateQueries({ queryKey: mediaKey(albumId ?? "") })
  return {
    create: useMutation({
      mutationFn: () => activitiesApi.ensureEventAlbum(eventId),
      onSuccess: refreshAlbum,
    }),
    setMemberUploads: useMutation({
      mutationFn: (member_uploads: boolean) => activitiesApi.updateAlbum(albumId ?? "", { member_uploads }),
      onSuccess: refreshAlbum,
    }),
    remove: useMutation({
      mutationFn: (id: string) => activitiesApi.deleteMedia(id),
      onSuccess: () => Promise.all([refreshMedia(), refreshAlbum()]),
    }),
    report: useMutation({
      mutationFn: (v: { id: string; reason: string; isSubject: boolean }) =>
        activitiesApi.reportMedia(v.id, {
          reason: v.reason,
          is_subject: v.isSubject,
        }),
      onSuccess: refreshMedia,
    }),
    upload: useMutation({
      mutationFn: async (v: { clubId: string; files: File[]; consentAttested: boolean }) => {
        for (const file of v.files)
          await uploadClubMedia(v.clubId, file, {
            albumId,
            consentAttested: v.consentAttested,
          })
      },
      onSettled: () => Promise.all([refreshMedia(), refreshAlbum()]),
    }),
  }
}

export function useEventEdit(eventId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: ["activities"] })
  return {
    update: useMutation({
      mutationFn: (body: EventPatch) => activitiesApi.updateEvent(eventId, body),
      onSuccess: done,
    }),
    setCover: useMutation({
      mutationFn: (mediaId: string | null) => activitiesApi.setEventCover(eventId, mediaId),
      onSuccess: done,
    }),
  }
}
