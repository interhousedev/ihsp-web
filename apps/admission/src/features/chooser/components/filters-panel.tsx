"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Switch } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { CountryInfoRow } from "../../countries/components/country-info"
import { facetOf } from "../facets"
import { EMPTY_FILTERS, SELECT_FILTERS, type FilterKey, type Filters } from "../filters"
import type { Facets } from "../facets"
import type { StudyGroup } from "../types"
import { countryCode, countryName } from "./option-label"
import { StudyFieldSelect } from "./study-field-select"

const CONTROL =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm md:h-9 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function Select({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const t = useT("chooser")
  // A value from the address that the catalog no longer lists stays selectable so it can be cleared.
  const all =
    value && !options.some((option) => option.value === value) ? [{ value, label: value }, ...options] : options
  return (
    <select id={id} className={CONTROL} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{t("filters.any")}</option>
      {all.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** The catalog filters as a form: nothing is searched until "Apply". Labels and options come from the catalog's facets. */
export function FiltersPanel({
  filters,
  facets,
  groups,
  onApply,
}: {
  filters: Filters
  facets: Facets | null
  groups: StudyGroup[]
  onApply: (filters: Filters) => void
}) {
  const t = useT("chooser")
  const locale = useLocale()
  const [draft, setDraft] = useState(filters)
  const set = <K extends FilterKey>(key: K, value: Filters[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const merit = facetOf(facets?.list, "merit_intl")
  const cost = facetOf(facets?.list, "max_cost")

  return (
    <form
      className="flex flex-col gap-4"
      aria-label={t("filters.title")}
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
    >
      {SELECT_FILTERS.map(({ param, key }) => {
        const facet = facetOf(facets?.list, param)
        if (!facet) return null
        const value = (draft[key] as string | undefined) ?? ""
        return (
          <Field key={param} id={`f-${param}`} label={facet.label}>
            <Select
              id={`f-${param}`}
              value={value}
              options={
                param === "country"
                  ? facet.options.map((o) => ({ value: o.value, label: countryName(o.value, locale) }))
                  : facet.options
              }
              onChange={(v) => set(key, v as never)}
            />
            {param === "country" && countryCode(value) ? (
              <CountryInfoRow codes={[countryCode(value) as string]} />
            ) : null}
          </Field>
        )
      })}
      <Field id="f-field" label={t("filters.field")}>
        <StudyFieldSelect id="f-field" value={draft.field} groups={groups} onChange={(v) => set("field", v)} />
      </Field>
      <Field id="f-max_cost" label={cost?.label ?? t("filters.maxCost")}>
        <Input
          id="f-max_cost"
          type="number"
          inputMode="numeric"
          min={0}
          max={cost?.max ?? undefined}
          value={draft.maxCost ?? ""}
          onChange={(event) => set("maxCost", event.target.value)}
        />
      </Field>
      {merit ? (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="f-merit_intl">{merit.label}</Label>
          <Switch
            id="f-merit_intl"
            checked={draft.meritIntl}
            onCheckedChange={(checked) => set("meritIntl", checked)}
          />
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="f-scholarships">{t("filters.scholarships")}</Label>
        <Switch
          id="f-scholarships"
          checked={draft.scholarships}
          onCheckedChange={(checked) => set("scholarships", checked)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <Icons.search aria-hidden />
          {t("filters.apply")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const cleared = { ...EMPTY_FILTERS, q: draft.q, sort: draft.sort }
            setDraft(cleared)
            onApply(cleared)
          }}
        >
          {t("filters.reset")}
        </Button>
      </div>
    </form>
  )
}
