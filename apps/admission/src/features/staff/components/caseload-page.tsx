"use client"

import { useT } from "@ihsp/i18n"
import { Icons, PageHeader, Skeleton, StateView } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { useAdmissionConfig } from "../../../lib/config"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useCaseload, type CaseloadFilters } from "../api"
import { CaseloadFiltersBar, type FilterOption } from "./caseload-filters"
import { CaseloadList } from "./caseload-list"
import { SavedViews } from "./saved-views"

export const STAFF_ROLES = ["teacher", "admin", "counselor", "mentor"] as const

/** Stage labels fall back to the raw value, so a stage the web does not know still shows. */
function useStageLabel() {
  const t = useT("staff")
  return (stage: string) => (t.has(`stages.${stage}`) ? t(`stages.${stage}`) : stage)
}

/** `/staff/`: the caseload with stage, risk, deadline and group filters and saved views. */
export function CaseloadContent() {
  const t = useT("staff")
  const stageLabel = useStageLabel()
  const [filters, setFilters] = useState<CaseloadFilters>({})
  const config = useAdmissionConfig()
  const all = useCaseload({})
  const filtered = useCaseload(filters)

  const stages = useMemo<FilterOption[]>(() => {
    const fromConfig = config.data?.stages
    const values = fromConfig ?? [...new Set((all.data?.items ?? []).flatMap((i) => (i.stage ? [i.stage] : [])))]
    return values.map((value) => ({ value, label: stageLabel(value) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.data, all.data])
  const groups = useMemo<FilterOption[]>(() => {
    const seen = new Map<string, string>()
    for (const item of all.data?.items ?? [])
      if (item.group_id) seen.set(item.group_id, item.group_name ?? item.group_id)
    return [...seen].map(([value, label]) => ({ value, label }))
  }, [all.data])

  const active = Boolean(filters.stage || filters.risk || filters.deadline_before || filters.group_id)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <PageHeader title={t("caseload.title")} />
      <SavedViews filters={filters} onApply={(view) => setFilters(view.filters)} />
      <CaseloadFiltersBar filters={filters} stages={stages} groups={groups} onChange={setFilters} />
      {filtered.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.isError ? (
        <StateView state="error" onRetry={() => void filtered.refetch()} />
      ) : filtered.data.items.length === 0 ? (
        <StateView
          state={active ? "filtered" : "empty"}
          icon={<Icons.teams className="size-8" />}
          title={active ? undefined : t("caseload.emptyTitle")}
          description={active ? undefined : t("caseload.emptyText")}
        />
      ) : (
        <CaseloadList items={filtered.data.items} stageLabel={stageLabel} />
      )}
    </div>
  )
}

export function CaseloadPage() {
  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <CaseloadContent />
    </AdmissionShell>
  )
}
