"use client"

import { useT } from "@ihsp/i18n"
import { StateView, cn } from "@ihsp/ui"
import { ReaderSheet } from "./reader-sheet"
import type { ReaderTocEntry } from "./reader-types"

/**
 * The contents of the item (`files[].toc`, the PDF outline or the EPUB navigation). A tap goes to the page or chapter
 * and closes the panel.
 */
export function TocPanel({
  open,
  onOpenChange,
  entries,
  loading,
  onSelect,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  entries: readonly ReaderTocEntry[]
  loading: boolean
  onSelect(entry: ReaderTocEntry): void
}) {
  const t = useT("library.reader")
  const usable = entries.filter((entry) => entry.page !== null || entry.href !== null)
  return (
    <ReaderSheet open={open} onOpenChange={onOpenChange} title={t("contents")} side="left">
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <StateView state="loading" rows={5} className="p-2" />
        ) : usable.length === 0 ? (
          <StateView state="empty" emptyText={t("contentsEmpty")} className="m-2" />
        ) : (
          <nav aria-label={t("contents")}>
            <ul>
              {usable.map((entry, index) => (
                <li key={`${index}-${entry.title}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(entry)
                      onOpenChange(false)
                    }}
                    style={{ paddingInlineStart: `${0.5 + Math.min(entry.level, 5) * 0.875}rem` }}
                    className={cn(
                      "hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-md pe-2 text-start text-sm outline-none focus-visible:ring-2 md:min-h-9",
                      entry.level === 0 && "font-medium",
                    )}
                  >
                    <span className="min-w-0 break-words">{entry.title}</span>
                    {entry.page !== null ? (
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{entry.page}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </ReaderSheet>
  )
}
