"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Progress } from "@ihsp/ui"
import type { SaveProgress } from "./save-material"

/** What the save is doing right now: the draft, the file being sent (with its share), attaching, submitting. */
export function SaveProgressView({ progress }: { progress: SaveProgress | null }) {
  const t = useT("library.upload.progress")
  const text = progress
    ? progress.stage === "uploading"
      ? t("uploading", { current: progress.current, total: progress.total })
      : t(progress.stage)
    : t("saving")
  return (
    <div role="status" aria-live="polite" className="bg-muted/40 flex flex-col gap-2 rounded-xl border p-3 text-sm">
      <p className="flex items-center gap-2">
        <Icons.spinner className="size-4 animate-spin" aria-hidden />
        {text}
      </p>
      {progress?.stage === "uploading" ? (
        <Progress value={Math.round(progress.fraction * 100)} aria-label={text} />
      ) : null}
    </div>
  )
}
