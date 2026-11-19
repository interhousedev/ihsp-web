"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Skeleton, StateView } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Carousel, Slide } from "../../../components/lib/carousel"
import { AppPageHeader, PageSection, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  useOpportunities,
  useOrgs,
  usePlan,
  useRemoveFromPlan,
  useSaveToPlan,
  type AwardType,
  type CatalogFilter,
  type CreditKind,
  type Opportunity,
  type Scope,
} from "../api"
import { FilterSelect } from "./catalog-page"
import { SubmitDialog } from "./submit-dialog"
import { OpportunityTabs } from "./opportunity-tabs"
import { ScholarshipCard } from "./scholarship-card"

const COVERAGE_TABS = ["all", "tuition", "money", "fellowships"] as const
type CoverageTab = (typeof COVERAGE_TABS)[number]
const AWARDS: AwardType[] = ["scholarship", "fellowship", "grant", "tuition_waiver"]
const SCOPES: Scope[] = ["local", "international"]
const CREDITS: CreditKind[] = ["yes", "possible", "none"]

/** Tuition, money and fellowship awards are not separate server filters: they group `award_type` and `coverage`. */
function inCoverage(item: Opportunity, tab: CoverageTab): boolean {
  const f = item.fields
  const coverage = f.coverage ?? []
  if (tab === "tuition")
    return f.award_type === "tuition_waiver" || coverage.some((c) => c === "full_tuition" || c === "partial_tuition")
  if (tab === "money") return f.award_type === "grant" || coverage.some((c) => c === "stipend" || c === "cash")
  if (tab === "fellowships") return f.award_type === "fellowship"
  return true
}

export function ScholarshipsBody() {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const [filter, setFilter] = useState<CatalogFilter>({})
  const [tab, setTab] = useState<CoverageTab>("all")
  const [suggesting, setSuggesting] = useState(false)
  const list = useOpportunities({ ...filter, kind: "scholarship", sort: "deadline" })
  const orgs = useOrgs()
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = useMemo(() => new Set(plan.data?.entries.map((e) => e.opportunity_id)), [plan.data])
  const mine = useMemo(
    () =>
      (plan.data?.opportunities ?? [])
        .filter((o) => o.fields.kind === "scholarship")
        // The plan payload carries no organization; resolve it so the avatar matches the catalog card.
        .map((o) => ({ ...o, org: o.org ?? orgs.data?.items.find((x) => x.id === o.fields.org_id) ?? null })),
    [plan.data, orgs.data],
  )
  const items = useMemo(() => (list.data?.items ?? []).filter((i) => inCoverage(i, tab)), [list.data, tab])

  function toggle(item: Opportunity) {
    const opts = { onError: (error: unknown) => toast.error(errorMessage(error)) }
    if (saved.has(item.id)) remove.mutate(item.id, opts)
    else
      save.mutate(
        { id: item.id, planned_grade: item.fields.grades?.[0] ?? null },
        { ...opts, onSuccess: () => toast.success(t("saved")) },
      )
  }
  const card = (item: Opportunity, className?: string) => (
    <ScholarshipCard
      key={item.id}
      item={item}
      saved={saved.has(item.id)}
      busy={save.isPending || remove.isPending}
      onToggle={() => toggle(item)}
      className={className}
    />
  )

  let body
  if (list.isPending) body = <Skeleton className="h-40 w-full" />
  else if (list.isError) body = <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
  else if (items.length === 0)
    body = (
      <StateView
        state="empty"
        icon={<Icons.search aria-hidden />}
        title={t("emptyTitle")}
        description={t("emptyText")}
      />
    )
  else
    body = (
      <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            {card(item)}
          </li>
        ))}
      </ul>
    )

  return (
    <div className={pageClass("wide")}>
      <AppPageHeader
        icon="courses"
        title={t("title")}
        actions={
          <Button size="sm" variant="outline" onClick={() => setSuggesting(true)}>
            <Icons.add />
            {t("suggest")}
          </Button>
        }
      />
      {suggesting && <SubmitDialog open onOpenChange={setSuggesting} />}
      <OpportunityTabs value="scholarships" planCount={plan.data?.entries.length ?? 0} />
      <PageSection title={t("scholarships.yours")}>
        {mine.length > 0 ? (
          <Carousel label={t("scholarships.yours")}>
            {mine.map((item) => (
              <Slide key={item.id}>{card(item)}</Slide>
            ))}
          </Carousel>
        ) : (
          <p className="text-muted-foreground text-sm">{t("scholarships.yoursEmpty")}</p>
        )}
      </PageSection>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("scholarships.coverageLabel")}>
        {COVERAGE_TABS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            className="rounded-full"
            variant={tab === value ? "default" : "outline"}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {t(`coverageTab.${value}`)}
          </Button>
        ))}
      </div>
      <div className="grid items-end gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor="scholarship-search" className="text-muted-foreground text-xs font-medium">
            {t("searchLabel")}
          </Label>
          <Input
            id="scholarship-search"
            placeholder={t("searchLabel")}
            value={filter.q ?? ""}
            onChange={(e) => setFilter({ ...filter, q: e.target.value || undefined })}
          />
        </div>
        <FilterSelect
          label={t("scholarships.scopeLabel")}
          anyLabel={t("scholarships.anyScope")}
          value={filter.scope}
          onChange={(v) => setFilter({ ...filter, scope: v as Scope | undefined })}
          options={SCOPES.map((s) => ({ value: s, label: t(`scope.${s}`) }))}
        />
        <FilterSelect
          label={t("scholarships.awardLabel")}
          anyLabel={t("scholarships.anyAward")}
          value={filter.award_type}
          onChange={(v) => setFilter({ ...filter, award_type: v as AwardType | undefined })}
          options={AWARDS.map((a) => ({ value: a, label: t(`award.${a}`) }))}
        />
        <FilterSelect
          label={t("scholarships.orgLabel")}
          anyLabel={t("scholarships.anyOrg")}
          value={filter.org_id}
          onChange={(v) => setFilter({ ...filter, org_id: v })}
          options={(orgs.data?.items ?? []).map((o) => ({ value: o.id, label: o.name }))}
        />
        <FilterSelect
          label={t("scholarships.creditLabel")}
          anyLabel={t("scholarships.anyCredit")}
          value={filter.college_credit}
          onChange={(v) => setFilter({ ...filter, college_credit: v as CreditKind | undefined })}
          options={CREDITS.map((c) => ({ value: c, label: t(`credit.${c}`) }))}
        />
      </div>
      {body}
    </div>
  )
}

export function ScholarshipsPage() {
  return (
    <AdmissionShell>
      <ScholarshipsBody />
    </AdmissionShell>
  )
}
