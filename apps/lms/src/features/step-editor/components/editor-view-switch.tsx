"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconColumns, IconEye, IconPencil } from "@ihsp/ui"

export type EditorView = "write" | "split" | "preview"

const ICONS = {
  write: IconPencil,
  split: IconColumns,
  preview: IconEye,
} as const

/** Write, side by side (wide screens only) or Preview: a segmented switch of pressed buttons. */
export function EditorViewSwitch({
  view,
  views,
  onChange,
}: {
  view: EditorView
  views: readonly EditorView[]
  onChange: (view: EditorView) => void
}) {
  const t = useT("markdownEditor")
  return (
    <div role="group" aria-label={t("view")} className="bg-muted flex shrink-0 rounded-lg p-0.5">
      {views.map((option) => {
        const Icon = ICONS[option]
        return (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            onClick={() => onChange(option)}
            className={cn(
              "text-muted-foreground focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none focus-visible:ring-2 md:pointer-fine:min-h-7",
              "aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {t(option)}
          </button>
        )
      })}
    </div>
  )
}
