"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { facetOf, optionLabel, type Facets } from "../facets"
import { SELECT_FILTERS, type FilterKey, type Filters } from "../filters"
import type { StudyGroup } from "../types"
import { studyFieldLabel } from "./study-field-select"

/** One chip per active filter ("Setting: Urban"), each removable, plus a clear-all button. */
export function ActiveChips({
  filters,
  active,
  facets,
  groups,
  onRemove,
  onClearAll,
}: {
  filters: Filters
  active: FilterKey[]
  facets: Facets | null
  groups: StudyGroup[]
  onRemove: (key: FilterKey) => void
  onClearAll: () => void
}) {
  const t = useT("chooser")
  if (active.length === 0) return null

  function describe(key: FilterKey): string {
    const select = SELECT_FILTERS.find((entry) => entry.key === key)
    if (select) {
      const facet = facetOf(facets?.list, select.param)
      return `${facet?.label ?? select.param}: ${optionLabel(facet, filters[key] as string)}`
    }
    if (key === "field") return `${t("filters.field")}: ${studyFieldLabel(groups, filters.field) ?? filters.field}`
    if (key === "meritIntl") return facetOf(facets?.list, "merit_intl")?.label ?? t("filters.meritIntl")
    if (key === "scholarships") return t("filters.scholarships")
    if (key === "maxCost")
      return `${facetOf(facets?.list, "max_cost")?.label ?? t("filters.maxCost")}: ${filters.maxCost}`
    return key
  }

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={t("filters.active")}>
      {active.map((key) => {
        const text = describe(key)
        return (
          <li key={key}>
            <button
              type="button"
              aria-label={t("filters.remove", { filter: text })}
              onClick={() => onRemove(key)}
              className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm"
            >
              {text}
              <Icons.close className="size-3.5" aria-hidden />
            </button>
          </li>
        )
      })}
      <li>
        <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
          {t("filters.clearAll")}
        </Button>
      </li>
    </ul>
  )
}
