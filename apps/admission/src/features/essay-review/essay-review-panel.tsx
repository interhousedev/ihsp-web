"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton } from "@ihsp/ui"
import { useState } from "react"
import { useList } from "../chooser/hooks"
import { MAX_REVIEW_INSTITUTIONS, useRunReviews, useStoredReviews } from "./api"
import { BaseReviewCard } from "./base-review-card"
import { ReviewError } from "./review-error"
import { UniversityTabs } from "./university-tabs"

export type EssayReviewPanelProps = {
  essayId: string
  /** Universities ticked at first (e.g. the list entry the essay belongs to). */
  entryInstitutionIds?: string[]
}

/** Picks up to 5 universities from the student's list, runs the reviews and shows the base review once plus a tab each. */
export function EssayReviewPanel({ essayId, entryInstitutionIds = [] }: EssayReviewPanelProps) {
  const t = useT("essayReview")
  const list = useList()
  const stored = useStoredReviews(essayId)
  const run = useRunReviews(essayId)
  const [picked, setPicked] = useState<string[] | null>(null)
  const options = (list.data ?? []).map((entry) => ({ id: entry.institution.id, name: entry.institution.name }))
  const selected = picked ?? entryInstitutionIds.slice(0, MAX_REVIEW_INSTITUTIONS)
  const data = run.data ?? stored.data

  const toggle = (id: string) =>
    setPicked(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  const start = (refresh: boolean) => run.mutate({ institution_ids: selected, refresh })

  return (
    <section aria-label={t("title")} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("pick", { max: MAX_REVIEW_INSTITUTIONS })}</legend>
        {options.length === 0 && !list.isLoading ? (
          <p className="text-muted-foreground text-sm">{t("emptyList")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const on = selected.includes(option.id)
            return (
              <label
                key={option.id}
                className="border-hairline-strong has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-ring/50 flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px]"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={run.isPending || (!on && selected.length >= MAX_REVIEW_INSTITUTIONS)}
                  onChange={() => toggle(option.id)}
                />
                {option.name}
              </label>
            )
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={run.isPending} onClick={() => start(false)}>
          <Icons.sparkles aria-hidden />
          {run.isPending ? t("running") : t("run")}
        </Button>
        {data?.base ? (
          <Button type="button" size="sm" variant="outline" disabled={run.isPending} onClick={() => start(true)}>
            {t("refresh")}
          </Button>
        ) : null}
      </div>
      <ReviewError error={run.error} />
      {run.isPending || stored.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {data?.base && !run.isPending ? (
        <>
          <BaseReviewCard review={data.base} stale={data.base_stale} />
          <UniversityTabs entries={data.universities} />
        </>
      ) : null}
    </section>
  )
}
