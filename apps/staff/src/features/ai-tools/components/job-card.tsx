"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconCheck, IconClock, IconLoader, IconMicrophone, IconVideo, IconX, Pill } from "@ihsp/ui"
import type { MediaJob } from "../api"
import { DownloadMediaButton } from "./download-media-button"

const TONE = { queued: "neutral", voicing: "primary", rendering: "primary", done: "success", failed: "danger" } as const
const ICON = { queued: IconClock, voicing: IconLoader, rendering: IconLoader, done: IconCheck, failed: IconX } as const

/** One media job: its server status; a finished one offers the mp4 (or audio) download. */
export function JobCard({ job, onRetry, retrying }: { job: MediaJob; onRetry?: (id: string) => void; retrying?: boolean }) {
  const t = useT("aiTools")
  const isVideo = job.kind === "video_with_voice"
  const Kind = isVideo ? IconVideo : IconMicrophone
  const StateIcon = ICON[job.status]
  const busy = job.status === "voicing" || job.status === "rendering"
  return (
    <li className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-card p-4 ring-1">
      <div className="flex items-start gap-3">
        <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full">
          <Kind className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-medium">{isVideo ? t("studio.outputs.video") : t("studio.outputs.audio")}</p>
          <Pill tone={TONE[job.status]} className="self-start">
            <StateIcon className={busy ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
            {t(`studio.state.${job.status}`)}
          </Pill>
        </div>
      </div>
      {job.status === "done" && job.file_id ? <DownloadMediaButton fileId={job.file_id} video={isVideo} /> : null}
      {job.status === "failed" ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted-foreground text-sm">{t("studio.failedKept")}</p>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" disabled={retrying} onClick={() => onRetry(job.id)}>
              {t("studio.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
