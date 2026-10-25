"use client"

import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import type { SaveStatus } from "../utils/save-status"

/** "Draft saved", "Unsaved changes", "Saving…", "Offline · kept in this browser" (UF-LMS-08, step 3). */
export function SaveIndicator({ status, draft }: { status: SaveStatus; draft?: boolean }) {
  const t = useT("saveState")
  const text = status === "saved" && draft ? t("draftSaved") : t(status)
  const warning = status === "offline" || status === "error" || status === "conflict"
  return (
    <span
      role="status"
      aria-live="polite"
      data-status={status}
      className={cn("inline-flex items-center gap-1.5 text-sm", warning ? "text-destructive" : "text-muted-foreground")}
    >
      {status === "saving" ? <Icons.spinner className="size-4 animate-spin" aria-hidden /> : null}
      {status === "saved" ? <Icons.check className="size-4" aria-hidden /> : null}
      {warning ? <Icons.warning className="size-4" aria-hidden /> : null}
      {text}
    </span>
  )
}
