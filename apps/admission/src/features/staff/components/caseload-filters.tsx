"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from "@ihsp/ui"
import type { CaseloadFilters } from "../api"

const ANY = "__any__"

export type FilterOption = { value: string; label: string }

function dateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ""
}

/** Stage, risk, deadline and group filters of the caseload; the options come from the backend's data. */
export function CaseloadFiltersBar({
  filters,
  stages,
  groups,
  onChange,
}: {
  filters: CaseloadFilters
  stages: FilterOption[]
  groups: FilterOption[]
  onChange: (next: CaseloadFilters) => void
}) {
  const t = useT("staff")
  const active = Boolean(filters.stage || filters.risk || filters.deadline_before || filters.group_id)

  function select(label: string, key: "stage" | "group_id", options: FilterOption[]) {
    if (options.length === 0) return null
    const items = [{ value: ANY, label: t("filters.any") }, ...options]
    return (
      <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium">
        {label}
        <Select
          items={items}
          value={filters[key] ?? ANY}
          onValueChange={(value) => onChange({ ...filters, [key]: value === ANY ? null : value })}
        >
          <SelectTrigger aria-label={label} className="min-h-11 w-full md:min-h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-3" role="group" aria-label={t("filters.title")}>
      {select(t("filters.stage"), "stage", stages)}
      {select(t("filters.group"), "group_id", groups)}
      <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium">
        {t("filters.deadlineBefore")}
        <Input
          type="date"
          aria-label={t("filters.deadlineBefore")}
          value={dateInputValue(filters.deadline_before)}
          onChange={(event) =>
            onChange({
              ...filters,
              deadline_before: event.target.value ? `${event.target.value}T23:59:59Z` : null,
            })
          }
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
        <Switch
          checked={Boolean(filters.risk)}
          onCheckedChange={(risk) => onChange({ ...filters, risk })}
          aria-label={t("filters.risk")}
        />
        {t("filters.risk")}
      </label>
      {active ? (
        <Button variant="ghost" onClick={() => onChange({})}>
          {t("filters.clear")}
        </Button>
      ) : null}
    </div>
  )
}
