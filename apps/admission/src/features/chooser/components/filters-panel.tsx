"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Switch } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { configOptions } from "../config-options"
import type { Facets } from "../facets"
import { EMPTY_FILTERS, type FilterKey, type Filters } from "../filters"
import { useAdmissionConfig } from "../../../lib/config"
import { useOptionLabel } from "./option-label"

const CONTROL =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm md:h-9 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"

function Field({ id, label, noData, children }: { id: string; label: string; noData: boolean; children: ReactNode }) {
  const t = useT("chooser")
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {noData ? <p className="text-muted-foreground text-xs">{t("filters.noDataHint")}</p> : null}
    </div>
  )
}

function Select({
  id,
  value,
  options,
  labelOf,
  onChange,
}: {
  id: string
  value: string
  options: string[]
  labelOf: (value: string) => string
  onChange: (value: string) => void
}) {
  const t = useT("chooser")
  // A value from the address that the catalog no longer lists stays selectable so it can be cleared.
  const all = value && !options.includes(value) ? [value, ...options] : options
  return (
    <select
      id={id}
      className={CONTROL}
      value={value}
      disabled={all.length === 0}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{t("filters.any")}</option>
      {all.map((option) => (
        <option key={option} value={option}>
          {labelOf(option)}
        </option>
      ))}
    </select>
  )
}

/** The catalog filters as a form: nothing is searched until "Apply". Options come from the config and the catalog. */
export function FiltersPanel({
  filters,
  facets,
  onApply,
}: {
  filters: Filters
  facets: Facets | null
  onApply: (filters: Filters) => void
}) {
  const t = useT("chooser")
  const config = useAdmissionConfig()
  const cityLabel = useOptionLabel("cityType")
  const aidLabel = useOptionLabel("aid")
  const [draft, setDraft] = useState(filters)
  const set = <K extends FilterKey>(key: K, value: Filters[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const noData = (key: FilterKey) => facets?.empty.has(key) ?? false
  const identity = (value: string) => value
  const cityTypes = configOptions(config.data, "city_types").filter((value) => value !== "any")

  return (
    <form
      className="flex flex-col gap-4"
      aria-label={t("filters.title")}
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
    >
      <Field id="f-country" label={t("filters.country")} noData={false}>
        <Select
          id="f-country"
          value={draft.country}
          options={facets?.countries ?? []}
          labelOf={identity}
          onChange={(v) => set("country", v)}
        />
      </Field>
      <Field id="f-field" label={t("filters.field")} noData={noData("field")}>
        <Select
          id="f-field"
          value={draft.field}
          options={facets?.fields ?? []}
          labelOf={identity}
          onChange={(v) => set("field", v)}
        />
      </Field>
      <Field id="f-city" label={t("filters.cityType")} noData={noData("cityType")}>
        <Select
          id="f-city"
          value={draft.cityType}
          options={cityTypes}
          labelOf={cityLabel}
          onChange={(v) => set("cityType", v)}
        />
      </Field>
      <Field id="f-study" label={t("filters.studyType")} noData={noData("studyType")}>
        <Select
          id="f-study"
          value={draft.studyType}
          options={facets?.studyTypes ?? []}
          labelOf={identity}
          onChange={(v) => set("studyType", v)}
        />
      </Field>
      <Field id="f-crime" label={t("filters.maxCrime")} noData={noData("maxCrime")}>
        <Input
          id="f-crime"
          type="number"
          inputMode="decimal"
          min={0}
          value={draft.maxCrime}
          onChange={(event) => set("maxCrime", event.target.value)}
        />
      </Field>
      <Field id="f-aid" label={t("filters.aid")} noData={noData("aid")}>
        <Select
          id="f-aid"
          value={draft.aid}
          options={facets?.aidBases ?? []}
          labelOf={aidLabel}
          onChange={(v) => set("aid", v)}
        />
      </Field>
      <Field id="f-cost" label={t("filters.maxCost")} noData={noData("maxCost")}>
        <Input
          id="f-cost"
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.maxCost}
          onChange={(event) => set("maxCost", event.target.value)}
        />
      </Field>
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
            const cleared = { ...EMPTY_FILTERS, q: draft.q }
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
