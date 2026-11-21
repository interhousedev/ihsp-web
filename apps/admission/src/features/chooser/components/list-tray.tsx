"use client"

import { useT } from "@ihsp/i18n"
import { Button, Skeleton } from "@ihsp/ui"
import { FitRing } from "../../fit/components/fit-ring"
import { RingLogo } from "../../fit/components/ring-logo"
import { useFitRows } from "../../fit/use-fit-rows"

/** The list on the right rail of matching: the best fits first, a ring around each circular logo, a way to the list. */
export function ListTray({ onOpenList }: { onOpenList: () => void }) {
  const t = useT("uniFlow")
  const { rows, isPending } = useFitRows()
  return (
    <section aria-label={t("tray.title")} className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("tray.title")}</h2>
        <span className="text-muted-foreground text-xs">{t("tray.count", { count: rows.length })}</span>
      </div>
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("tray.empty")}</p>
      ) : (
        <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
          {rows.map(({ entry, fit }) => (
            <li key={entry.id} className="flex min-w-0 items-center gap-3">
              <FitRing metrics={fit.metrics} size={40}>
                <RingLogo name={entry.institution.name} src={entry.institution.logo_url} />
              </FitRing>
              <span className="min-w-0 flex-1 truncate text-sm">{entry.institution.name}</span>
              <span className="text-muted-foreground text-xs tabular-nums" aria-label={fit.total == null ? t("tray.unknown") : undefined}>
                {fit.total == null ? "–" : Math.round(fit.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={onOpenList}>
          {t("tray.open")}
        </Button>
      ) : null}
    </section>
  )
}
