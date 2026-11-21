"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Pill,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StateView,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { useStudentGrade } from "../../../config/applicant"
import { useSchoolGrades } from "../../../lib/config"
import { OpportunityTabs } from "./opportunity-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  localName,
  useOpportunities,
  usePlan,
  useRemoveFromPlan,
  useSaveToPlan,
  useTaxonomy,
  type CatalogFilter,
  type CatalogSort,
} from "../api"
import { careerPlanQuery } from "../../career/api"
import { CategoryTabs, RelevanceBar, parseCategory, parseSort, type Category } from "./catalog-controls"
import { NextStep } from "../../../components/next-step"
import { bySchoolLevel } from "../level"
import { OpportunityCard, SaveButton } from "./opportunity-card"
import { SubmitDialog } from "./submit-dialog"

const ANY = "any"
const COSTS = ["free", "50", "200", "1000"] as const
const HOURS = [3, 6, 10, 20] as const
const WITHIN = [30, 90, 180, 365] as const
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** The cost choice as API filters: "free" means a known zero cost, a number a ceiling in USD. */
function costFilter(cost: string | undefined): Pick<CatalogFilter, "free" | "max_tuition"> {
  if (!cost) return {}
  return cost === "free" ? { free: true } : { max_tuition: Number(cost) }
}

function costLabel(t: ReturnType<typeof useT>, cost: string): string {
  return cost === "free" ? t("filters.free") : t("filters.costUpTo", { amount: cost })
}
const PLAN_HREF = "/plan/?view=saved"

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  anyLabel,
}: {
  label: string
  /** The "any" option text, e.g. "Any scope"; defaults to "<label>: any". */
  anyLabel?: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  options: { value: string; label: string }[]
}) {
  const t = useT("opportunities")
  const id = useId()
  const any = anyLabel ?? `${label}: ${t("any")}`
  const shown = value ? (options.find((o) => o.value === value)?.label ?? value) : any
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </span>
      <Select value={value ?? ANY} onValueChange={(v) => onChange(!v || v === ANY ? undefined : v)}>
        <SelectTrigger aria-labelledby={id} className="w-full">
          <SelectValue>{shown}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{any}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CatalogBody() {
  const GRADES = useSchoolGrades()
  const t = useT("opportunities")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const category = parseCategory(params.get("kind"))
  const myGrade = useStudentGrade()
  const [other, setFilter] = useState<CatalogFilter>({})
  const [gradeTouched, setGradeTouched] = useState(false)
  // Until the student picks a grade, the catalog shows the opportunities of their own grade (school level first).
  useEffect(() => {
    if (myGrade !== null && !gradeTouched) setFilter((f) => (f.grade === undefined ? { ...f, grade: myGrade } : f))
  }, [myGrade, gradeTouched])
  const [cost, setCost] = useState<string | undefined>()
  const filter: CatalogFilter = {
    ...other,
    ...costFilter(cost),
    kind: category === "all" ? undefined : category,
    sort: parseSort(params.get("sort")) ?? "deadline",
  }
  const [text, setText] = useState("")
  useEffect(() => {
    const id = setTimeout(() => setFilter((f) => ({ ...f, q: text.trim() || undefined })), 300)
    return () => clearTimeout(id)
  }, [text])
  const [suggesting, setSuggesting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const taxonomy = useTaxonomy()
  const career = useQuery(careerPlanQuery())
  const list = useOpportunities(filter)
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = useMemo(() => new Set(plan.data?.entries.map((e) => e.opportunity_id)), [plan.data])
  const fields = taxonomy.data?.fields ?? []
  const subfields = fields.find((f) => f.id === filter.field_id)?.subfields ?? []

  function setQuery(change: { kind?: Category | null; sort?: CatalogSort }) {
    const next = new URLSearchParams(params.toString())
    if (change.kind !== undefined) {
      if (change.kind === null) next.delete("kind")
      else next.set("kind", change.kind)
    }
    if (change.sort) next.set("sort", change.sort)
    const text = next.toString()
    router.replace(text ? `${pathname}?${text}` : pathname)
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

  const shownItems = useMemo(() => bySchoolLevel(list.data?.items ?? [], myGrade), [list.data, myGrade])
  let body
  if (list.isPending) body = <Skeleton className="h-40 w-full" />
  else if (list.isError) body = <StateView state="error" onRetry={() => void list.refetch()} />
  else if (shownItems.length === 0)
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
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {shownItems.map((item) => (
          <OpportunityCard
            key={item.id}
            item={item}
            action={
              <SaveButton
                saved={saved.has(item.id)}
                busy={save.isPending || remove.isPending}
                onClick={() => toggle(item.id, item.fields.grades ?? [])}
              />
            }
          />
        ))}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="courses"
        title={t("title")}
        actions={
          <Button type="button" size="sm" variant="outline" onClick={() => setSuggesting(true)}>
            <Icons.add aria-hidden />
            {t("suggest")}
          </Button>
        }
      />
      <SplitLayout
        asideFirst
        aside={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start md:hidden"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Icons.search aria-hidden className="size-4" />
              {t("view.filtersTitle")}
            </Button>
            <div className={filtersOpen ? "" : "hidden md:block"}>
              <AsideCard title={t("view.filtersTitle")} icon={<Icons.search aria-hidden className="size-4" />}>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                  <Input
                    aria-label={t("searchLabel")}
                    placeholder={t("searchLabel")}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <FilterSelect
                    label={t("fieldLabel")}
                    value={filter.field_id}
                    onChange={(v) =>
                      setFilter({ ...other, field_id: v, subfield_id: undefined, subject_id: undefined })
                    }
                    options={fields.map((f) => ({ value: f.id, label: localName(f.name, locale) }))}
                  />
                  {subfields.length > 0 && (
                    <FilterSelect
                      label={t("subfieldLabel")}
                      value={filter.subfield_id}
                      onChange={(v) => setFilter({ ...other, subfield_id: v, subject_id: undefined })}
                      options={subfields.map((s) => ({ value: s.id, label: localName(s.name, locale) }))}
                    />
                  )}
                  <FilterSelect
                    label={t("gradeLabel")}
                    value={filter.grade?.toString()}
                    onChange={(v) => {
                      setGradeTouched(true)
                      setFilter({ ...other, grade: v ? Number(v) : undefined })
                    }}
                    options={GRADES.map((g) => ({ value: String(g), label: t("gradeShort", { grade: g }) }))}
                  />
                  <FilterSelect
                    label={t("filters.delivery")}
                    value={filter.delivery}
                    onChange={(v) => setFilter({ ...other, delivery: v as CatalogFilter["delivery"] })}
                    options={(["local", "external"] as const).map((d) => ({ value: d, label: t(`delivery.${d}`) }))}
                  />
                  <FilterSelect
                    label={t("filters.cost")}
                    value={cost}
                    onChange={setCost}
                    options={COSTS.map((c) => ({ value: c, label: costLabel(t, c) }))}
                  />
                  <FilterSelect
                    label={t("filters.hours")}
                    value={filter.max_hours?.toString()}
                    onChange={(v) => setFilter({ ...other, max_hours: v ? Number(v) : undefined })}
                    options={HOURS.map((h) => ({ value: String(h), label: t("filters.hoursUpTo", { hours: h }) }))}
                  />
                  <FilterSelect
                    label={t("filters.starts")}
                    value={filter.starts_within?.toString()}
                    onChange={(v) => setFilter({ ...other, starts_within: v ? Number(v) : undefined })}
                    options={WITHIN.map((d) => ({ value: String(d), label: t("filters.startsWithin", { days: d }) }))}
                  />
                  <FilterSelect
                    label={t("filters.startMonth")}
                    value={filter.starts_month?.toString()}
                    onChange={(v) => setFilter({ ...other, starts_month: v ? Number(v) : undefined })}
                    options={MONTHS.map((m) => ({
                      value: String(m),
                      label: new Date(2000, m - 1, 1).toLocaleDateString(locale, { month: "long" }),
                    }))}
                  />
                </div>
                {list.data ? (
                  <Pill tone="primary" className="self-start">
                    {t("view.results", { count: shownItems.length })}
                  </Pill>
                ) : null}
              </AsideCard>
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <OpportunityTabs value="catalog" planCount={plan.data?.entries.length ?? 0} />
          <CategoryTabs value={category} onChange={(next) => setQuery({ kind: next === "all" ? null : next })} />
          {list.data ? (
            <RelevanceBar
              sort={list.data.sort}
              labels={career.data?.study_focus.labels ?? []}
              onSort={(next) => setQuery({ sort: next })}
            />
          ) : null}
          {suggesting && <SubmitDialog open onOpenChange={setSuggesting} />}
          <ScrollFade maxHeight="75vh">{body}</ScrollFade>
          {saved.size > 0 ? <NextStep href={PLAN_HREF} label={t("openPlan")} hint={t("nextPlanHint")} /> : null}
        </div>
      </SplitLayout>
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
