"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { KIND_FILTERS, type LinkKindFilter } from "../utils/link-display"

type KindFilterProps = { value: LinkKindFilter; onChange: (value: LinkKindFilter) => void }

/** Filter chips by kind; they scroll sideways on a 360 px screen. */
export function KindFilter({ value, onChange }: KindFilterProps) {
  const t = useT("links.kind")
  return (
    <div role="group" aria-label={t("filter")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {KIND_FILTERS.map((kind) => (
        <Button
          key={kind}
          type="button"
          size="sm"
          variant={kind === value ? "default" : "outline"}
          className="min-h-11 shrink-0 px-4"
          aria-pressed={kind === value}
          onClick={() => onChange(kind)}
        >
          {t(kind)}
        </Button>
      ))}
    </div>
  )
}
