"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, ResponsiveDialog, Skeleton } from "@ihsp/ui"
import { useEssay } from "../api"
import { useEssayText, wordsOf } from "./essay-text"

/** The final text of an essay as it will be pasted: the words and characters against the limit, and Copy. */
export function EssayPreview({ essayId, title, limit, onClose }: { essayId: string | null; title: string; limit: number | null; onClose: () => void }) {
  const t = useT("essayLedger")
  const query = useEssay(essayId)
  const { copy } = useEssayText()
  const body = query.data?.body ?? ""
  const words = wordsOf(body)
  const over = limit !== null && words > limit
  return (
    <ResponsiveDialog
      open={essayId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      size="lg"
      footer={
        <Button type="button" disabled={!essayId || !query.data} onClick={() => essayId && void copy(essayId)}>
          <Icons.copy aria-hidden />
          {t("copy")}
        </Button>
      }
    >
      {query.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="flex flex-col gap-3" data-testid="essay-preview">
          <p className={cn("text-sm font-medium tabular-nums", over ? "text-destructive" : "text-muted-foreground")} data-testid="preview-count">
            {limit !== null ? t("previewCountLimit", { words, limit, chars: body.length }) : t("previewCount", { words, chars: body.length })}
            {over ? ` · ${t("overBy", { count: words - (limit ?? 0) })}` : ""}
          </p>
          <div className="bg-muted/30 max-h-[55dvh] overflow-y-auto rounded-md border p-4 text-sm leading-relaxed whitespace-pre-wrap [scrollbar-gutter:stable]">{body}</div>
        </div>
      )}
    </ResponsiveDialog>
  )
}
