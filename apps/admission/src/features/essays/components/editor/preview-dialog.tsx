"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, ResponsiveDialog } from "@ihsp/ui"
import { countWords } from "../../diff"
import { useCopyFinal } from "./use-copy-final"

/** The final text of the draft as it will be pasted, read-only, with the words and characters against the limit. */
export function PreviewDialog({
  open,
  onOpenChange,
  title,
  body,
  limit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  limit: number | null
}) {
  const t = useT("essayEditor")
  const copy = useCopyFinal(body)
  const words = countWords(body)
  const over = limit !== null && limit > 0 && words > limit
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title || t("previewTitle")}
      size="lg"
      footer={
        <Button type="button" disabled={!body.trim()} onClick={() => void copy()}>
          <Icons.copy aria-hidden />
          {t("copyFinal")}
        </Button>
      }
    >
      {body.trim() ? (
        <div className="flex flex-col gap-3" data-testid="editor-preview">
          <p
            data-testid="preview-count"
            className={cn("text-sm font-medium tabular-nums", over ? "text-destructive" : "text-muted-foreground")}
          >
            {limit ? t("previewCountLimit", { words, limit, chars: body.length }) : t("previewCount", { words, chars: body.length })}
            {over ? ` · ${t("overBy", { count: words - limit })}` : ""}
          </p>
          <div className="bg-muted/30 max-h-[55dvh] overflow-y-auto rounded-md border p-4 text-sm leading-relaxed whitespace-pre-wrap [scrollbar-gutter:stable]">
            {body}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("previewEmpty")}</p>
      )}
    </ResponsiveDialog>
  )
}
