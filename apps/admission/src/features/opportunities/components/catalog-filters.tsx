"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Input, Pill, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ihsp/ui"
import { useId } from "react"
import { useSchoolGrades } from "../../../lib/config"
import {
  localName,
  useOrgs,
  useTaxonomy,
  type AwardType,
  type CatalogFilter,
  type CreditKind,
  type Opportunity,
  type Scope,
} from "../api"
import type { Category } from "./catalog-controls"

const ANY = "any"
const COSTS = ["free", "50", "200", "1000"] as const
const HOURS = [3, 6, 10, 20] as const
const WITHIN = [30, 90, 180, 365] as const
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const AWARDS: AwardType[] = ["scholarship", "fellowship", "grant", "tuition_waiver"]
const SCOPES: Scope[] = ["local", "international"]
const CREDITS: CreditKind[] = ["yes", "possible", "none"]

export const COVERAGE_TABS = ["all", "tuition", "money", "fellowships"] as const
export type CoverageTab = (typeof COVERAGE_TABS)[number]

/** Filters that exist on the activity tabs only, and on the scholarship tab only: a switch clears the other group. */
export const ACTIVITY_KEYS = ["delivery", "max_hours", "starts_within", "starts_month"] as const
export const SCHOLARSHIP_KEYS = ["scope", "award_type", "org_id", "college_credit"] as const

/** Tuition, money and fellowship awards are not separate server filters: they group `award_type` and `coverage`. */
export function inCoverage(item: Opportunity, tab: CoverageTab): boolean {
  const f = item.fields
  const coverage = f.coverage ?? []
  if (tab === "tuition")
    return f.award_type === "tuition_waiver" || coverage.some((c) => c === "full_tuition" || c === "partial_tuition")
  if (tab === "money") return f.award_type === "grant" || coverage.some((c) => c === "stipend" || c === "cash")
  if (tab === "fellowships") return f.award_type === "fellowship"
  return true
}

/** How many filters narrow the list: the badge of the phone "Filters" button. */
export function activeCount(kind: Category, filter: CatalogFilter, cost: string | undefined, text: string): number {
  const keys: (keyof CatalogFilter)[] = [
    "field_id",
    "subfield_id",
    "grade",
    ...(kind === "scholarship" ? SCHOLARSHIP_KEYS : ACTIVITY_KEYS),
  ]
  const set = keys.filter((k) => filter[k] !== undefined).length
  return set + (kind !== "scholarship" && cost ? 1 : 0) + (text.trim() ? 1 : 0)
}

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

function costLabel(t: ReturnType<typeof useT>, cost: string): string {
  return cost === "free" ? t("filters.free") : t("filters.costUpTo", { amount: cost })
}

/** The filter controls of the catalog: a common group, then the group of the current tab. The container is the caller's. */
export function CatalogFilters({
  kind,
  filter,
  onChange,
  onGradeTouched,
  cost,
  onCost,
  text,
  onText,
  count,
  onReset,
}: {
  kind: Category
  filter: CatalogFilter
  onChange: (next: CatalogFilter) => void
  onGradeTouched: () => void
  cost: string | undefined
  onCost: (value: string | undefined) => void
  text: string
  onText: (value: string) => void
  /** Results under the current filters; undefined while loading. */
  count: number | undefined
  /** Omitted inside the dialog, whose footer already carries the result count and Reset. */
  onReset?: () => void
}) {
  const GRADES = useSchoolGrades()
  const t = useT("opportunities")
  const locale = useLocale()
  const taxonomy = useTaxonomy()
  const orgs = useOrgs()
  const fields = taxonomy.data?.fields ?? []
  const subfields = fields.find((f) => f.id === filter.field_id)?.subfields ?? []
  const scholarship = kind === "scholarship"
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
        <Input
          aria-label={t("searchLabel")}
          placeholder={t("searchLabel")}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
        <FilterSelect
          label={t("fieldLabel")}
          value={filter.field_id}
          onChange={(v) => onChange({ ...filter, field_id: v, subfield_id: undefined, subject_id: undefined })}
          options={fields.map((f) => ({ value: f.id, label: localName(f.name, locale) }))}
        />
        {subfields.length > 0 && (
          <FilterSelect
            label={t("subfieldLabel")}
            value={filter.subfield_id}
            onChange={(v) => onChange({ ...filter, subfield_id: v, subject_id: undefined })}
            options={subfields.map((s) => ({ value: s.id, label: localName(s.name, locale) }))}
          />
        )}
        <FilterSelect
          label={t("gradeLabel")}
          value={filter.grade?.toString()}
          onChange={(v) => {
            onGradeTouched()
            onChange({ ...filter, grade: v ? Number(v) : undefined })
          }}
          options={GRADES.map((g) => ({ value: String(g), label: t("gradeShort", { grade: g }) }))}
        />
        {scholarship ? (
          <>
            <FilterSelect
              label={t("scholarships.scopeLabel")}
              anyLabel={t("scholarships.anyScope")}
              value={filter.scope}
              onChange={(v) => onChange({ ...filter, scope: v as Scope | undefined })}
              options={SCOPES.map((s) => ({ value: s, label: t(`scope.${s}`) }))}
            />
            <FilterSelect
              label={t("scholarships.awardLabel")}
              anyLabel={t("scholarships.anyAward")}
              value={filter.award_type}
              onChange={(v) => onChange({ ...filter, award_type: v as AwardType | undefined })}
              options={AWARDS.map((a) => ({ value: a, label: t(`award.${a}`) }))}
            />
            <FilterSelect
              label={t("scholarships.orgLabel")}
              anyLabel={t("scholarships.anyOrg")}
              value={filter.org_id}
              onChange={(v) => onChange({ ...filter, org_id: v })}
              options={(orgs.data?.items ?? []).map((o) => ({ value: o.id, label: o.name }))}
            />
            <FilterSelect
              label={t("scholarships.creditLabel")}
              anyLabel={t("scholarships.anyCredit")}
              value={filter.college_credit}
              onChange={(v) => onChange({ ...filter, college_credit: v as CreditKind | undefined })}
              options={CREDITS.map((c) => ({ value: c, label: t(`credit.${c}`) }))}
            />
          </>
        ) : (
          <>
            <FilterSelect
              label={t("filters.delivery")}
              value={filter.delivery}
              onChange={(v) => onChange({ ...filter, delivery: v as CatalogFilter["delivery"] })}
              options={(["local", "external"] as const).map((d) => ({ value: d, label: t(`delivery.${d}`) }))}
            />
            <FilterSelect
              label={t("filters.cost")}
              value={cost}
              onChange={onCost}
              options={COSTS.map((c) => ({ value: c, label: costLabel(t, c) }))}
            />
            <FilterSelect
              label={t("filters.hours")}
              value={filter.max_hours?.toString()}
              onChange={(v) => onChange({ ...filter, max_hours: v ? Number(v) : undefined })}
              options={HOURS.map((h) => ({ value: String(h), label: t("filters.hoursUpTo", { hours: h }) }))}
            />
            <FilterSelect
              label={t("filters.starts")}
              value={filter.starts_within?.toString()}
              onChange={(v) => onChange({ ...filter, starts_within: v ? Number(v) : undefined })}
              options={WITHIN.map((d) => ({ value: String(d), label: t("filters.startsWithin", { days: d }) }))}
            />
            <FilterSelect
              label={t("filters.startMonth")}
              value={filter.starts_month?.toString()}
              onChange={(v) => onChange({ ...filter, starts_month: v ? Number(v) : undefined })}
              options={MONTHS.map((m) => ({
                value: String(m),
                label: new Date(2000, m - 1, 1).toLocaleDateString(locale, { month: "long" }),
              }))}
            />
          </>
        )}
      </div>
      {onReset ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {count !== undefined ? (
            <Pill tone="primary" className="self-start">
              {t("view.results", { count })}
            </Pill>
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            {t("filters.reset")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
