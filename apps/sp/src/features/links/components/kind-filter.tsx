"use client"

import { useT } from "@ihsp/i18n"
import { ListToolbar } from "@ihsp/ui"
import { KIND_FILTERS, type LinkKindFilter } from "../utils/link-display"

type KindFilterProps = { value: LinkKindFilter; onChange: (value: LinkKindFilter) => void }

/** Filter buttons by kind; they scroll sideways on a 360 px screen. */
export function KindFilter({ value, onChange }: KindFilterProps) {
  const t = useT("links.kind")
  return (
    <ListToolbar
      filters={[
        {
          kind: "segment",
          key: "kind",
          label: t("filter"),
          allValue: "all",
          options: KIND_FILTERS.map((kind) => ({ value: kind, label: t(kind) })),
        },
      ]}
      values={{ kind: value }}
      onChange={(_key, next) => onChange((next ?? "all") as LinkKindFilter)}
    />
  )
}
