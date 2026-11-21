"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, SortableList } from "@ihsp/ui"
import type { Profession } from "../api"
import { MAX_PICKS } from "../model"
import { RiskBadge } from "./profession-card"

/** Step 3: the ranked picks. Drag the handle (or Space and the arrows) to reorder; the first one counts most. */
export function MyProfessions({
  picks,
  saving,
  error,
  onReorder,
  onRemove,
}: {
  picks: Profession[]
  saving: boolean
  error: boolean
  onReorder: (items: Profession[]) => void
  onRemove: (id: string) => void
}) {
  const t = useT("professions")
  if (picks.length === 0) {
    return <p className="text-muted-foreground rounded-card border border-dashed p-4 text-sm">{t("mine.empty", { max: MAX_PICKS })}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      <SortableList
        items={picks}
        onReorder={onReorder}
        handleLabel={t("mine.drag")}
        label={t("mine.title")}
        renderItem={(p, index) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-medium">{p.name}</span>
              <RiskBadge profession={p} />
            </div>
            <Button type="button" size="icon" variant="ghost" aria-label={t("mine.remove", { name: p.name })} onClick={() => onRemove(p.id)}>
              <Icons.close aria-hidden className="size-4" />
            </Button>
          </div>
        )}
      />
      <p className="text-muted-foreground text-xs" aria-live="polite">
        {error ? t("mine.error") : saving ? t("mine.saving") : t("mine.count", { count: picks.length, max: MAX_PICKS })}
      </p>
    </div>
  )
}
