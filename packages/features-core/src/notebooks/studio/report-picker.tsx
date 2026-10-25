"use client"

import type { ReportFormat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconFileText, IconListDetails, IconMessageQuestion, IconNews, IconPencil, IconTimeline } from "@ihsp/ui"
import type { Icon } from "@ihsp/ui"
import { ResponsiveDialog } from "./responsive-dialog"

/** The report formats of the picker; the conspect has its own tile. */
export type PickableFormat = Exclude<ReportFormat, "conspect">

const FORMATS: readonly { format: PickableFormat; icon: Icon }[] = [
  { format: "study_guide", icon: IconListDetails },
  { format: "briefing", icon: IconFileText },
  { format: "faq", icon: IconMessageQuestion },
  { format: "timeline", icon: IconTimeline },
  { format: "article", icon: IconNews },
  { format: "custom", icon: IconPencil },
]

export type ReportPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (format: PickableFormat) => void
}

/** "Choose a report format": cards that continue into the Customize dialog of a report with that format. */
export function ReportPicker({ open, onOpenChange, onPick }: ReportPickerProps) {
  const t = useT("notebooks")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("report.pickTitle")}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {FORMATS.map(({ format, icon: FormatIcon }) => (
          <li key={format}>
            <button
              type="button"
              className="hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 w-full items-start gap-3 rounded-lg border p-3 text-start outline-none focus-visible:ring-3"
              onClick={() => onPick(format)}
            >
              <FormatIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{t(`format.${format}`)}</span>
                <span className="text-muted-foreground text-xs">{t(`studio.formatHint.${format}`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ResponsiveDialog>
  )
}
