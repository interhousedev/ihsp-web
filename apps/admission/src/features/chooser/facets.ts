import { compareDeadline } from "../../lib/deadline-tone"
import type { SortKey } from "./filters"
import type { Facet, Institution, StudyGroup } from "./types"

/** Display order of the study-field groups' entries: sorted, deduplicated by label. */
export function tidyStudyGroups(groups: StudyGroup[]): StudyGroup[] {
  const seen = new Set<string>()
  const collator = new Intl.Collator(undefined, { sensitivity: "base" })
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          const key = item.label.trim().toLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        .toSorted((a, b) => collator.compare(a.label, b.label)),
    }))
    .filter((group) => group.items.length > 0)
    .toSorted((a, b) => collator.compare(a.label, b.label))
}

/** The facet of one query parameter, if the catalog describes it. */
export function facetOf(facets: Facet[] | undefined, param: string): Facet | undefined {
  return facets?.find((facet) => facet.param === param)
}

/** Label of one option value of a facet; an unknown value shows as sent. */
export function optionLabel(facet: Facet | undefined, value: string): string {
  return facet?.options.find((option) => option.value === value)?.label ?? value
}

/** The catalog's facets, with the country values pulled out for the pickers that only need them. */
export type Facets = { list: Facet[]; countries: string[] }

export function toFacets(list: Facet[]): Facets {
  return { list, countries: facetOf(list, "country")?.options.map((option) => option.value) ?? [] }
}

export type { Facet, StudyGroup }

/** Sorts the loaded results; "relevance" keeps the order the catalog returned, "deadline" puts the soonest first. */
export function sortInstitutions(items: Institution[], sort: SortKey): Institution[] {
  if (sort === "deadline") return items.toSorted((a, b) => compareDeadline(a.next_deadline, b.next_deadline))
  if (sort === "name") return items.toSorted((a, b) => a.name.localeCompare(b.name))
  if (sort === "cost")
    return items.toSorted((a, b) => {
      const left = a.coa_total === null ? Infinity : Number(a.coa_total)
      const right = b.coa_total === null ? Infinity : Number(b.coa_total)
      return left - right
    })
  return items
}
