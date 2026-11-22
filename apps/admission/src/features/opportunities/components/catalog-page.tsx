"use client"

import { Carousel, Slide } from "../../../components/lib/carousel"
import { AppPageHeader, PageSection, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, ResponsiveDialog, Skeleton, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { useStudentGrade } from "../../../config/applicant"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  useOpportunities,
  useOrgs,
  usePlan,
  useRemoveFromPlan,
  useSaveToPlan,
  type CatalogFilter,
  type CatalogSort,
} from "../api"
import { careerPlanQuery } from "../../career/api"
import { OpportunityNav, RelevanceBar, parseCategory, parseSort } from "./catalog-controls"
import {
  ACTIVITY_KEYS,
  COVERAGE_TABS,
  CatalogFilters,
  SCHOLARSHIP_KEYS,
  activeCount,
  inCoverage,
  type CoverageTab,
} from "./catalog-filters"
import { bySchoolLevel } from "../level"
import { OpportunityCard, SaveButton } from "./opportunity-card"
import { ScholarshipCard } from "./scholarship-card"
import { SubmitDialog } from "./submit-dialog"

const PLAN_HREF = "/plan/"

/** The cost choice as API filters: "free" means a known zero cost, a number a ceiling in USD. */
function costFilter(cost: string | undefined): Pick<CatalogFilter, "free" | "max_tuition"> {
  if (!cost) return {}
  return cost === "free" ? { free: true } : { max_tuition: Number(cost) }
}

/** `filter` without the listed keys. */
function without(filter: CatalogFilter, keys: readonly (keyof CatalogFilter)[]): CatalogFilter {
  const next = { ...filter }
  for (const key of keys) delete next[key]
  return next
}

export function CatalogBody() {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const category = parseCategory(params.get("kind"))
  const scholarship = category === "scholarship"
  const myGrade = useStudentGrade()
  const [other, setFilter] = useState<CatalogFilter>({})
  const [gradeTouched, setGradeTouched] = useState(false)
  // Until the student picks a grade, the activity tabs show the opportunities of their own grade (school level first).
  // Scholarships mostly carry no grades, so that preset would hide them: the tab never applies it.
  useEffect(() => {
    if (myGrade !== null && !gradeTouched && !scholarship)
      setFilter((f) => (f.grade === undefined ? { ...f, grade: myGrade } : f))
  }, [myGrade, gradeTouched, scholarship])
  const [cost, setCost] = useState<string | undefined>()
  const [coverage, setCoverage] = useState<CoverageTab>("all")
  // A filter that only exists on the other tab must never narrow this list.
  useEffect(() => {
    setFilter((f) => without(f, scholarship ? ACTIVITY_KEYS : SCHOLARSHIP_KEYS))
    if (scholarship) setCost(undefined)
    else setCoverage("all")
  }, [scholarship])
  const [text, setText] = useState("")
  useEffect(() => {
    const id = setTimeout(() => setFilter((f) => ({ ...f, q: text.trim() || undefined })), 300)
    return () => clearTimeout(id)
  }, [text])
  const shownFilter: CatalogFilter = {
    ...other,
    ...(scholarship ? {} : costFilter(cost)),
    grade: scholarship && !gradeTouched ? undefined : other.grade,
  }
  const filter: CatalogFilter = {
    ...shownFilter,
    kind: category === "all" ? undefined : category,
    sort: scholarship ? "deadline" : (parseSort(params.get("sort")) ?? "deadline"),
  }
  const [suggesting, setSuggesting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const career = useQuery(careerPlanQuery())
  const list = useOpportunities(filter)
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = useMemo(() => new Set(plan.data?.entries.map((e) => e.opportunity_id)), [plan.data])

  function setSort(sort: CatalogSort) {
    const next = new URLSearchParams(params.toString())
    next.set("sort", sort)
    router.replace(`${pathname}?${next.toString()}`)
  }

  function reset() {
    setGradeTouched(true)
    setFilter({})
    setCost(undefined)
    setText("")
  }

  function toggle(id: string, grades: number[]) {
    const opts = { onError: (error: unknown) => toast.error(errorMessage(error)) }
    if (saved.has(id)) remove.mutate(id, opts)
    else
      save.mutate(
        { id, planned_grade: (myGrade !== null && grades.includes(myGrade) ? myGrade : grades[0]) ?? null },
        {
          ...opts,
          onSuccess: () =>
            toast.success(t("saved"), {
              action: { label: t("openPlan"), onClick: () => router.push(PLAN_HREF) },
            }),
        },
      )
  }

  const shownItems = useMemo(() => {
    const items = bySchoolLevel(list.data?.items ?? [], myGrade)
    return scholarship ? items.filter((i) => inCoverage(i, coverage)) : items
  }, [list.data, myGrade, scholarship, coverage])
  const count = list.data ? shownItems.length : undefined
  const active = activeCount(category, shownFilter, cost, text)
  const orgs = useOrgs()
  const mine = useMemo(
    () =>
      (plan.data?.opportunities ?? [])
        .filter((o) => o.fields.kind === "scholarship")
        // The plan payload carries no organization; resolve it so the avatar matches the catalog card.
        .map((o) => ({ ...o, org: o.org ?? orgs.data?.items.find((x) => x.id === o.fields.org_id) ?? null })),
    [plan.data, orgs.data],
  )
  const busy = save.isPending || remove.isPending

  let body
  if (list.isPending) body = <Skeleton className="h-40 w-full" />
  else if (list.isError) body = <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
  else if (shownItems.length === 0)
    body =
      active > 0 || coverage !== "all" ? (
        <StateView
          state="filtered"
          onReset={() => {
            reset()
            setCoverage("all")
          }}
        />
      ) : (
        <StateView
          state="empty"
          icon={<Icons.search aria-hidden />}
          title={t("emptyTitle")}
          description={t("emptyText")}
        />
      )
  else if (scholarship)
    body = (
      <ul className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
        {shownItems.map((item) => (
          <li key={item.id} className="min-w-0">
            <ScholarshipCard
              item={item}
              saved={saved.has(item.id)}
              busy={busy}
              onToggle={() => toggle(item.id, item.fields.grades ?? [])}
            />
          </li>
        ))}
      </ul>
    )
  else
    body = (
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {shownItems.map((item) => (
          <OpportunityCard
            key={item.id}
            item={item}
            action={
              <SaveButton
                saved={saved.has(item.id)}
                busy={busy}
                onClick={() => toggle(item.id, item.fields.grades ?? [])}
              />
            }
          />
        ))}
      </ul>
    )

  const filterProps = {
    kind: category,
    filter: shownFilter,
    onChange: setFilter,
    onGradeTouched: () => setGradeTouched(true),
    cost,
    onCost: setCost,
    text,
    onText: setText,
  }
  const filters = (
    <CatalogFilters {...filterProps} count={count} onReset={reset} />
  )
  const filtersButton = (
    <Button type="button" variant="outline" className="min-h-11 md:hidden" onClick={() => setFiltersOpen(true)}>
      <Icons.search aria-hidden className="size-4" />
      {active > 0 ? t("filters.button", { count: active }) : t("view.filtersTitle")}
    </Button>
  )

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="courses"
        title={t("title")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {saved.size > 0 ? (
              <Link href={PLAN_HREF} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Icons.heart aria-hidden />
                {t("planLink", { count: saved.size })}
              </Link>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => setSuggesting(true)}>
              <Icons.add aria-hidden />
              {t("suggest")}
            </Button>
          </div>
        }
      />
      <OpportunityNav value={category} />
      {scholarship ? (
        <PageSection title={t("scholarships.yours")}>
          {mine.length > 0 ? (
            <Carousel label={t("scholarships.yours")}>
              {mine.map((item) => (
                <Slide key={item.id}>
                  <ScholarshipCard
                    item={item}
                    saved
                    busy={busy}
                    onToggle={() => toggle(item.id, item.fields.grades ?? [])}
                  />
                </Slide>
              ))}
            </Carousel>
          ) : (
            <p className="text-muted-foreground text-sm">{t("scholarships.yoursEmpty")}</p>
          )}
        </PageSection>
      ) : null}
      {scholarship ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("scholarships.coverageLabel")}>
          {COVERAGE_TABS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              className="rounded-full"
              variant={coverage === value ? "default" : "outline"}
              aria-pressed={coverage === value}
              onClick={() => setCoverage(value)}
            >
              {t(`coverageTab.${value}`)}
            </Button>
          ))}
        </div>
      ) : null}
      <SplitLayout
        asideFirst
        aside={
          <div className="hidden md:block">
            <AsideCard title={t("view.filtersTitle")} icon={<Icons.search aria-hidden className="size-4" />}>
              {filters}
            </AsideCard>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {scholarship ? (
            <div className="md:hidden">{filtersButton}</div>
          ) : (
            <RelevanceBar
              sort={list.data?.sort ?? "title"}
              labels={career.data?.study_focus.labels ?? []}
              onSort={setSort}
              leading={filtersButton}
            />
          )}
          {suggesting && <SubmitDialog open onOpenChange={setSuggesting} />}
          <ScrollFade className="max-h-[75vh] xl:max-h-[calc(100dvh-25rem)]">{body}</ScrollFade>
        </div>
      </SplitLayout>
      {filtersOpen ? (
        <ResponsiveDialog
          open
          onOpenChange={setFiltersOpen}
          title={t("view.filtersTitle")}
          footer={
            <>
              <Button type="button" variant="outline" onClick={reset}>
                {t("filters.reset")}
              </Button>
              <Button type="button" onClick={() => setFiltersOpen(false)}>
                {t("filters.show", { count: shownItems.length })}
              </Button>
            </>
          }
        >
          <CatalogFilters {...filterProps} count={undefined} />
        </ResponsiveDialog>
      ) : null}
    </div>
  )
}

export function CatalogPage() {
  return (
    <AdmissionShell>
      <CatalogBody />
    </AdmissionShell>
  )
}
