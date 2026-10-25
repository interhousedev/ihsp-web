"use client"

import { getLmsPreviewStepVideoQuery, getLmsStepVideoQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { VideoFile } from "../../shared/components/video-file"
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
}: {
  url: string
  caption: string
  source?: "link" | "upload"
  fileId?: string | null
  blockId?: string
  courseId?: string
  stepId?: string
  preview?: boolean
}) {
  const t = useT("player")
  const embed = videoEmbed(url)
  const where: Where | null =
    source === "upload" && fileId && blockId && courseId && stepId ? { courseId, stepId, blockId, preview } : null
  return (
    <figure className="flex flex-col gap-2">
      {where && fileId ? (
        <UploadedVideo where={where} fileId={fileId} label={caption || t("video")} />
      ) : source === "upload" ? (
        <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
      ) : embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={caption || t("video")}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-lg border"
        />
      ) : embed.kind === "file" ? (
        <VideoFile src={embed.src} label={caption || t("video")} positionKey={embed.src} />
      ) : (
        <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
      )}
      {caption ? <figcaption className="text-muted-foreground text-sm">{caption}</figcaption> : null}
    </figure>
  )
}

function UploadedVideo({ where, fileId, label }: { where: Where; fileId: string; label: string }) {
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
      onError={() => {
        // The signed URL has probably expired: ask for a new one once.
        setFailures((count) => count + 1)
        void stream.refetch()
      }}
    />
  )
}
