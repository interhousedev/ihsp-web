"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons, Input, Skeleton, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { PageLoading } from "@ihsp/features-core"
import { useAdmissionConfig } from "../../../lib/config"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useCaseload, type CaseloadFilters, type CaseloadScope } from "../api"
import { StaffOverview } from "../../home/components/staff-overview"
import { CaseloadFiltersBar, type FilterOption } from "./caseload-filters"
import { CaseloadList } from "./caseload-list"
import { SavedViews } from "./saved-views"
import { QueryError } from "../../shell/components/query-error"

export const STAFF_ROLES = ["admin", "counselor", "mentor"] as const

function useDebounced(value: string, ms = 300): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

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
  const { session } = useSession()
  const isAdmin = !!session?.user.roles?.includes("admin")
  const [scope, setScope] = useState<CaseloadScope>("mine")
  const [search, setSearch] = useState("")
  const q = useDebounced(search)
  const all = useCaseload({ scope })
  const filtered = useCaseload({ ...filters, scope, q })

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

  const active = Boolean(filters.stage || filters.risk || filters.deadline_before || filters.group_id || q.trim())

  return (
    <div className={pageClass()}>
      <AppPageHeader icon="teams" title={t("caseload.title")} />
      {all.data ? <StaffOverview items={all.data.items} /> : null}
      {isAdmin ? (
        <Tabs value={scope} onValueChange={(next) => setScope(next === "all" ? "all" : "mine")}>
          <TabsList>
            <TabsTrigger value="mine" className="min-h-11 md:min-h-9">
              {t("scope.mine")}
            </TabsTrigger>
            <TabsTrigger value="all" className="min-h-11 md:min-h-9">
              {t("scope.all")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}
      <div className="relative">
        <Icons.search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("scope.search")}
          aria-label={t("scope.search")}
          className="min-h-11 pl-9 md:min-h-8"
        />
      </div>
      <SavedViews filters={filters} onApply={(view) => setFilters(view.filters)} />
      <CaseloadFiltersBar filters={filters} stages={stages} groups={groups} onChange={setFilters} />
      {filtered.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.isError ? (
        <QueryError error={filtered.error} onRetry={() => void filtered.refetch()} />
      ) : filtered.data.items.length === 0 ? (
        <StateView
          state={active ? "filtered" : "empty"}
          icon={<Icons.teams className="size-8" />}
          title={active ? undefined : t("caseload.emptyTitle")}
          description={active ? undefined : t("caseload.emptyText")}
        />
      ) : (
        <CaseloadList items={filtered.data.items} stageLabel={stageLabel} canAssign={isAdmin} />
      )}
    </div>
  )
}

/** Transcript officers have no caseload: `/staff/` sends them to their queue. */
export function CaseloadPage() {
  const router = useRouter()
  const { session } = useSession()
  const roles = session?.user.roles
  const officerOnly =
    !!roles?.includes("transcript_officer") && !roles.some((role) => (STAFF_ROLES as readonly string[]).includes(role))
  useEffect(() => {
    if (officerOnly) router.replace("/staff/transcripts/")
  }, [officerOnly, router])
  if (officerOnly) return <PageLoading />
  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <CaseloadContent />
    </AdmissionShell>
  )
}
