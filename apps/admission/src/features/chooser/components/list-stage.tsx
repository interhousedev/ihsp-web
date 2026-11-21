"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Icons, Pill, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { LIST_SOFT_CAP } from "../list-model"
import type { ListEntry } from "../types"
import { useListRows, type ListRow } from "../use-list-rows"
import { AddSchoolRow } from "./add-school-row"
import { FieldFocus, useStudyFocusLabels } from "./field-focus"
import { ConflictBanner } from "./list-conflicts"
import { ListHead, ListRowView } from "./list-row"
import { ListTotals } from "./list-totals"
import { PlanOffer } from "./plan-offer"
import { ResearchDialog } from "./research-dialog"

/**
 * The list stage: one comparison table for the list and its money. Best fit first (unknown last), each row with the
 * fit ring, the cost after aid, the chance, the student's label, the round, the deadline and the tasks; a totals row
 * against the family budget; a soft warning past 12. Rows are cards on a phone.
 */
export function UniListStage() {
  const t = useT("uniList")
  const data = useListRows()
  const focus = useStudyFocusLabels()
  const [researching, setResearching] = useState<ListRow | null>(null)
  const [added, setAdded] = useState<ListEntry | null>(null)
  const { rows } = data
  const noField = focus !== undefined && focus.length === 0
  if (data.isPending) return <StateView state="loading" rows={4} />

  return (
    <section aria-label={t("title")} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <Pill tone="primary">{t("count", { count: rows.length })}</Pill>
        {data.fitFailed ? <span className="text-muted-foreground text-xs">{t("fitFailed")}</span> : null}
      </div>
      {rows.length > LIST_SOFT_CAP ? (
        <Alert className="text-warning" data-testid="soft-cap">
          <Icons.warning aria-hidden />
          <AlertDescription>{t("cap", { cap: LIST_SOFT_CAP, count: rows.length })}</AlertDescription>
        </Alert>
      ) : null}
      {noField ? <FieldFocus /> : null}
      <ConflictBanner entries={rows.map((row) => row.entry)} />
      {added ? <PlanOffer key={added.id} entry={added} onDone={() => setAdded(null)} /> : null}
      {rows.length === 0 ? (
        <StateView
          state="empty"
          icon={<Icons.search className="size-8" aria-hidden />}
          title={t("emptyTitle")}
          description={t("emptyText")}
          action={
            <Link href="/chooser/?step=match" className="text-primary inline-flex min-h-11 items-center text-sm underline-offset-2 hover:underline">
              {t("find")}
            </Link>
          }
        />
      ) : (
        <div className="@container flex flex-col gap-2">
          <ListHead />
          <ul aria-label={t("title")} className="flex flex-col gap-3 @xl:gap-0">
            {rows.map((row) => (
              <ListRowView key={row.entry.id} row={row} onResearch={setResearching} />
            ))}
          </ul>
          <ListTotals data={data} />
        </div>
      )}
      <AddSchoolRow onAdded={setAdded} />
      <Link href="/opportunities/scholarships/" className="text-muted-foreground inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-2">
        {t("scholarships")}
      </Link>
      <ResearchDialog row={researching} onClose={() => setResearching(null)} />
    </section>
  )
}
