"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconAlertTriangle, IconLoader2, IconX } from "@ihsp/ui"
import { AiReadingIcon } from "./ai-status-icon"
import type { UploadRow } from "./use-upload-to-notebook"

const RING_RADIUS = 7
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** A small determinate progress ring; the percentage is also read out for screen readers. */
function ProgressRing({ fraction }: { fraction: number }) {
  const clamped = Math.min(Math.max(fraction, 0), 1)
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r={RING_RADIUS} fill="none" strokeWidth="2.5" className="stroke-muted" />
      <circle
        cx="10"
        cy="10"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset]"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - clamped)}
      />
    </svg>
  )
}

type PendingUploadRowProps = {
  row: UploadRow
  onDismiss: (key: string) => void
}

/**
 * A file the user just dropped or picked, shown in the list before its source exists: a progress ring while it
 * uploads, a spinner while it is being added, and a warning with a dismiss button when it fails.
 */
export function PendingUploadRow({ row, onDismiss }: PendingUploadRowProps) {
  const t = useT()
  const tNotebooks = useT("notebooks")
  const percent = Math.round(row.fraction * 100)

  if (row.phase === "failed") {
    return (
      <li role="alert" className="flex items-center rounded-lg bg-amber-500/5">
        <div className="flex min-h-11 min-w-0 flex-1 items-start gap-2 py-1 ps-2 pe-1">
          <IconAlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{row.name}</span>
            <span className="block text-xs break-words text-amber-700 dark:text-amber-400">{row.message}</span>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-11 shrink-0 md:size-8"
          aria-label={t("files.upload.dismiss")}
          onClick={() => onDismiss(row.key)}
        >
          <IconX aria-hidden />
        </Button>
      </li>
    )
  }

  const uploading = row.phase === "uploading"
  return (
    <li className={cn("flex items-center rounded-lg")} aria-busy="true">
      <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-1 ps-2 pe-3">
        {uploading ? (
          <span role="progressbar" aria-label={row.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <ProgressRing fraction={row.fraction} />
          </span>
        ) : (
          <IconLoader2
            aria-hidden
            className="text-muted-foreground size-5 shrink-0 animate-spin motion-reduce:animate-none"
          />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium" title={row.name}>
            {row.name}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            {uploading ? (
              <span className="tabular-nums">{t("files.upload.percent", { percent })}</span>
            ) : (
              <>
                <AiReadingIcon label={tNotebooks("row.aiReadingNow")} />
                {tNotebooks("row.aiReadingNow")}
              </>
            )}
          </span>
        </span>
      </div>
    </li>
  )
}
