"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

export type ToolbarProps = {
  words: number
  wordLimit: number | null
  onUndo: () => void
  onRedo: () => void
  onReview: () => void
  onTools: () => void
}

/** Slim toolbar: undo / redo, the word count against the limit, Review and the plan tools. */
export function Toolbar({ words, wordLimit, onUndo, onRedo, onReview, onTools }: ToolbarProps) {
  const t = useT("essays")
  const over = wordLimit !== null && wordLimit > 0 && words > wordLimit
  return (
    <div
      role="toolbar"
      aria-label={t("editor.toolbar")}
      className="border-hairline flex flex-wrap items-center gap-1 border-b px-3 py-1.5"
    >
      <Button type="button" size="icon-sm" variant="ghost" aria-label={t("editor.undo")} onClick={onUndo}>
        <Icons.undo aria-hidden />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={t("editor.redo")} onClick={onRedo}>
        <Icons.undo aria-hidden className="-scale-x-100" />
      </Button>
      <span
        id="essay-count"
        className={over ? "text-destructive ml-2 text-sm font-medium" : "text-muted-foreground ml-2 text-sm"}
      >
        {wordLimit ? t("wordsOf", { count: words, limit: wordLimit }) : t("words", { count: words })}
        {over ? ` · ${t("overLimit", { count: words - wordLimit })}` : ""}
      </span>
      <span className="flex-1" />
      <Button type="button" size="sm" variant="outline" onClick={onTools}>
        {t("editor.tools")}
      </Button>
      <Button type="button" size="sm" onClick={onReview}>
        <Icons.sparkles aria-hidden />
        {t("tabs.review")}
      </Button>
    </div>
  )
}
