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
import { useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
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
  type OpportunityKind,
} from "../api"
import { OpportunityCard, SaveButton } from "./opportunity-card"
import { SubmitDialog } from "./submit-dialog"

export const KINDS: OpportunityKind[] = ["exam", "certification", "course", "scholarship", "event", "recurring"]
export const GRADES = [9, 10, 11, 12] as const
const ANY = "any"

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
  const t = useT("opportunities")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const [filter, setFilter] = useState<CatalogFilter>({})
  const [suggesting, setSuggesting] = useState(false)
  const taxonomy = useTaxonomy()
  const list = useOpportunities(filter)
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = useMemo(() => new Set(plan.data?.entries.map((e) => e.opportunity_id)), [plan.data])
  const fields = taxonomy.data?.fields ?? []
  const subfields = fields.find((f) => f.id === filter.field_id)?.subfields ?? []

  function toggle(id: string, grades: number[]) {
    const opts = { onError: (error: unknown) => toast.error(errorMessage(error)) }
    if (saved.has(id)) remove.mutate(id, opts)
    else save.mutate({ id, planned_grade: grades[0] ?? null }, { ...opts, onSuccess: () => toast.success(t("saved")) })
  }

  let body
  if (list.isPending) body = <Skeleton className="h-40 w-full" />
  else if (list.isError) body = <StateView state="error" onRetry={() => void list.refetch()} />
  else if (list.data.items.length === 0)
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
        {list.data.items.map((item) => (
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
    <div className={pageClass("wide")}>
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
          <AsideCard title={t("view.filtersTitle")} icon={<Icons.search aria-hidden className="size-4" />}>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Input
                aria-label={t("searchLabel")}
                placeholder={t("searchLabel")}
                value={filter.q ?? ""}
                onChange={(e) => setFilter({ ...filter, q: e.target.value || undefined })}
              />
              <FilterSelect
                label={t("fieldLabel")}
                value={filter.field_id}
                onChange={(v) => setFilter({ ...filter, field_id: v, subfield_id: undefined, subject_id: undefined })}
                options={fields.map((f) => ({ value: f.id, label: localName(f.name, locale) }))}
              />
              {subfields.length > 0 && (
                <FilterSelect
                  label={t("subfieldLabel")}
                  value={filter.subfield_id}
                  onChange={(v) => setFilter({ ...filter, subfield_id: v, subject_id: undefined })}
                  options={subfields.map((s) => ({ value: s.id, label: localName(s.name, locale) }))}
                />
              )}
              <FilterSelect
                label={t("kindLabel")}
                value={filter.kind}
                onChange={(v) => setFilter({ ...filter, kind: v as OpportunityKind | undefined })}
                options={KINDS.map((k) => ({ value: k, label: t(`kind.${k}`) }))}
              />
              <FilterSelect
                label={t("gradeLabel")}
                value={filter.grade?.toString()}
                onChange={(v) => setFilter({ ...filter, grade: v ? Number(v) : undefined })}
                options={GRADES.map((g) => ({ value: String(g), label: t("gradeShort", { grade: g }) }))}
              />
            </div>
            {list.data ? (
              <Pill tone="primary" className="self-start">
                {t("view.results", { count: list.data.items.length })}
              </Pill>
            ) : null}
          </AsideCard>
        }
      >
        <div className="flex flex-col gap-4">
          <OpportunityTabs value="catalog" planCount={plan.data?.entries.length ?? 0} />
          {suggesting && <SubmitDialog open onOpenChange={setSuggesting} />}
          <ScrollFade maxHeight="75vh">{body}</ScrollFade>
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
