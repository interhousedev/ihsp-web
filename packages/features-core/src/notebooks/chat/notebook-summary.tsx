"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Markdown, Skeleton, cn } from "@ihsp/ui"
import { IconCopy, IconPin, IconThumbDown, IconThumbUp } from "@tabler/icons-react"
import { useState } from "react"
import { toast } from "sonner"
import { useAddSources } from "../api"
import { copyText, markersToBrackets, useNotebookErrorMessage } from "../lib"

const ICON_BUTTON = "size-11 md:size-8"

/**
 * The notebook summary under the title: safe Markdown with the icon row (Save to note, Copy, 👍, 👎). While the
 * summary is being (re)built the text is replaced by a quiet line; with no sources there is nothing to show.
 */
export function NotebookSummary({ notebook }: { notebook: NotebookDetail }) {
  const t = useT("notebooks.chat")
  const tm = useT("assistant.message")
  const tc = useT("common")
  const errorMessage = useNotebookErrorMessage()
  const addSources = useAddSources(notebook.id)
  // There is no endpoint for rating a summary, so the thumbs only mark the choice on this screen.
  const [rating, setRating] = useState<"up" | "down" | null>(null)

  if (notebook.source_count === 0) return null

  const summary = notebook.summary
  if (!summary) {
    if (notebook.summary_status === "stale" || notebook.summary_status === "building") {
      return (
        <div role="status" className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">{t("summaryBuilding")}</p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )
    }
    if (notebook.summary_status === "failed") {
      return <p className="text-muted-foreground text-sm">{t("summaryFailed")}</p>
    }
    return null
  }

  function save() {
    addSources.mutate([{ kind: "note", title: notebook.title, body_md: summary?.summary ?? "" }], {
      onSuccess: (result) => {
        const rejected = result.rejected[0]
        if (rejected) toast.error(errorMessage(rejected.error))
        else toast.success(t("savedToNote"))
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  async function copy() {
    const copied = await copyText(markersToBrackets(summary?.summary ?? ""))
    if (copied) toast.success(tc("copied"))
    else toast.error(errorMessage(undefined))
  }

  return (
    <section aria-label={t("summary")} className="flex flex-col gap-1">
      <Markdown className="text-sm leading-relaxed">{summary.summary}</Markdown>
      <div role="group" aria-label={t("summaryActions")} className="-ms-2 flex flex-wrap items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 px-2 md:min-h-8"
          disabled={addSources.isPending}
          onClick={save}
        >
          <IconPin aria-hidden />
          {t("saveToNote")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={ICON_BUTTON}
          aria-label={tm("copy")}
          title={tm("copy")}
          onClick={() => void copy()}
        >
          <IconCopy aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={ICON_BUTTON}
          aria-label={tm("like")}
          title={tm("like")}
          aria-pressed={rating === "up"}
          onClick={() => setRating("up")}
        >
          <IconThumbUp aria-hidden className={cn(rating === "up" && "fill-current")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={ICON_BUTTON}
          aria-label={tm("dislike")}
          title={tm("dislike")}
          aria-pressed={rating === "down"}
          onClick={() => setRating("down")}
        >
          <IconThumbDown aria-hidden className={cn(rating === "down" && "fill-current")} />
        </Button>
      </div>
    </section>
  )
}
