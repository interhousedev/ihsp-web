"use client"

import {
  getLmsPreviewStepCaptionsQuery,
  getLmsPreviewStepVideoQuery,
  getLmsStepCaptionsQuery,
  getLmsStepVideoQuery,
  type LearningCaptionTrack,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { VideoFile } from "../../shared/components/video-file"
import { type CaptionSource, useCaptionTracks } from "../../shared/hooks/use-caption-tracks"
import { videoEmbed } from "../utils/video"

/** Stream URLs live 15 minutes; fetch a new one a little before. */
const STREAM_STALE_MS = 10 * 60_000

type Where = {
  courseId: string
  stepId: string
  blockId: string
  preview: boolean
}

/**
 * A video step: an embed for YouTube / Vimeo links, a native player for direct files and for uploads. An upload plays
 * from a short-lived storage URL that the LMS issues after checking the enrollment (or the staff right in a preview).
 * WebVTT caption tracks play on the native player only; YouTube and Vimeo embeds keep their own captions.
 */
export function VideoBlock({
  url,
  caption,
  source = "link",
  fileId = null,
  blockId,
  courseId,
  stepId,
  preview = false,
  captions = [],
}: {
  url: string
  caption: string
  source?: "link" | "upload"
  fileId?: string | null
  blockId?: string
  courseId?: string
  stepId?: string
  preview?: boolean
  captions?: LearningCaptionTrack[]
}) {
  const t = useT("player")
  const embed = videoEmbed(url)
  const where: Where | null =
    source === "upload" && fileId && blockId && courseId && stepId ? { courseId, stepId, blockId, preview } : null
  const tracks = useCaptions(
    captions.length && blockId && courseId && stepId ? { courseId, stepId, blockId, preview } : null,
  )
  return (
    <figure className="flex flex-col gap-2">
      {where && fileId ? (
        <UploadedVideo where={where} fileId={fileId} label={caption || t("video")} tracks={tracks} />
      ) : source === "upload" ? (
        <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
      ) : embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={caption || t("video")}
          allowFullScreen
          // Only the YouTube/Vimeo players (videoEmbed, pinned by video.test.ts) may get this sandbox: with
          // allow-same-origin it grants full access to its own origin, so never reuse it for LMS-origin content.
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-lg border"
        />
      ) : embed.kind === "file" ? (
        <VideoFile src={embed.src} label={caption || t("video")} positionKey={embed.src} tracks={tracks} />
      ) : (
        <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
      )}
      {embed.kind === "iframe" && source !== "upload" && captions.length ? (
        <p className="text-muted-foreground text-sm">{t("captionsEmbedUnsupported")}</p>
      ) : null}
      {caption ? <figcaption className="text-muted-foreground text-sm">{caption}</figcaption> : null}
    </figure>
  )
}

/** Caption track URLs of the block (when it has tracks), loaded into local `blob:` URLs. */
function useCaptions(where: Where | null): CaptionSource[] {
  const options = where?.preview
    ? getLmsPreviewStepCaptionsQuery(where.courseId, where.stepId, where.blockId)
    : getLmsStepCaptionsQuery(where?.courseId ?? "", where?.stepId ?? "", where?.blockId ?? "")
  const query = useQuery({
    ...options,
    enabled: where !== null,
    staleTime: STREAM_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  })
  return useCaptionTracks(query.data?.tracks)
}

function UploadedVideo({
  where,
  fileId,
  label,
  tracks,
}: {
  where: Where
  fileId: string
  label: string
  tracks: CaptionSource[]
}) {
  const t = useT("player")
  const [failures, setFailures] = useState(0)
  const options = where.preview
    ? getLmsPreviewStepVideoQuery(where.courseId, where.stepId, where.blockId)
    : getLmsStepVideoQuery(where.courseId, where.stepId, where.blockId)
  const stream = useQuery({
    ...options,
    staleTime: STREAM_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (stream.isPending) return <div className="bg-muted aspect-video w-full animate-pulse rounded-lg" aria-hidden />
  if (!stream.data || failures > 1) return <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
  return (
    <VideoFile
      src={stream.data.url}
      label={label}
      positionKey={fileId}
      tracks={tracks}
      onError={() => {
        // The signed URL has probably expired: ask for a new one once.
        setFailures((count) => count + 1)
        void stream.refetch()
      }}
    />
  )
}
