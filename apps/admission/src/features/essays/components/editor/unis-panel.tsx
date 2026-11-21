"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Pill, Skeleton } from "@ihsp/ui"
import { CoachError } from "../coach-error"
import { useGroupCritique, useStoredReviews, type UniEntry } from "../../flow/steps-api"
import type { Essay } from "../../api"
import { SuppInfo } from "../supp-info"

function UniCard({ entry }: { entry: UniEntry }) {
  const t = useT("essayFlow")
  const r = entry.review
  return (
    <li className="bg-card border-hairline rounded-card flex flex-col gap-2 border p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="min-w-0 truncate text-sm font-semibold">{entry.name}</h4>
        {entry.stale ? <Pill tone="warning">{t("deep.stale")}</Pill> : null}
      </div>
      <div className="flex items-center gap-2" role="img" aria-label={t("deep.alignment", { value: r.alignment })}>
        <div className="bg-hairline h-2 flex-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, r.alignment))}%` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums">{r.alignment}</span>
      </div>
      <p className="text-sm">{r.fit_summary}</p>
      {r.risks.length > 0 ? (
        <ul className="text-muted-foreground list-disc pl-4 text-xs">
          {r.risks.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : null}
      {r.supplement_tips.length > 0 ? (
        <div>
          <p className="text-xs font-medium">{t("deep.tips")}</p>
          <ul className="text-muted-foreground list-disc pl-4 text-xs">
            {r.supplement_tips.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

/** The Вузы tab: fit per university, the prompts this essay answers (with fork) and the college's own prompts. */
export function UnisPanel({ essay, onReview }: { essay: Essay; onReview: () => void }) {
  const t = useT("essayFlow")
  const te = useT("essayEditor")
  const stored = useStoredReviews(essay.id)
  const critique = useGroupCritique(essay.id)
  const unis = (critique.data ?? stored.data)?.universities ?? []
  return (
    <div className="flex flex-col gap-4" data-testid="unis-panel">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("deep.fit")}</h3>
        {stored.isPending ? <Skeleton className="h-24 w-full" /> : null}
        {unis.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {unis.map((u) => (
              <UniCard key={u.institution_id} entry={u} />
            ))}
          </ul>
        ) : stored.isSuccess ? (
          <p className="text-muted-foreground text-sm">{t("deep.fitEmpty")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={critique.isPending} onClick={() => critique.mutate(unis.length > 0)}>
            <Icons.sparkles aria-hidden />
            {critique.isPending ? t("deep.running") : unis.length > 0 ? t("deep.fitRerun") : t("deep.fitRun")}
          </Button>
          <Button type="button" variant="ghost" onClick={onReview}>
            {te("detailedReview")}
          </Button>
        </div>
        <CoachError error={critique.error} />
      </section>
      <SuppInfo essay={essay} />
    </div>
  )
}
