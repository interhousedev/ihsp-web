import type { Filters, FilterKey } from "./filters"
import type { Institution } from "./types"

/** What the catalog holds: filter options that have no list of their own are read from its institutions. */
export type Facets = {
  countries: string[]
  fields: string[]
  studyTypes: string[]
  aidBases: string[]
  /** Filters nobody in the catalog has a value for: choosing them can only give "no data", not "no match". */
  empty: Set<FilterKey>
}

function distinct(values: Iterable<string>): string[] {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b))
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return value ? [value] : []
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item !== "")
  return []
}

const factPresent = (key: string) => (item: Institution) => {
  const value = item.facts[key]?.value
  return value !== null && value !== undefined && value !== ""
}

export function deriveFacets(items: Institution[]): Facets {
  const has = (test: (item: Institution) => boolean) => items.some(test)
  const empty = new Set<FilterKey>()
  if (!has(factPresent("city_type"))) empty.add("cityType")
  if (!has(factPresent("study_type"))) empty.add("studyType")
  if (!has((item) => typeof item.facts.crime_index?.value === "number")) empty.add("maxCrime")
  if (!has((item) => item.aid_basis !== null)) empty.add("aid")
  if (!has((item) => item.coa_total !== null)) empty.add("maxCost")
  if (!has(factPresent("fields"))) empty.add("field")
  return {
    countries: distinct(items.map((item) => item.country).filter(Boolean)),
    fields: distinct(items.flatMap((item) => strings(item.facts.fields?.value))),
    studyTypes: distinct(items.flatMap((item) => strings(item.facts.study_type?.value))),
    aidBases: distinct(items.flatMap((item) => (item.aid_basis ? [item.aid_basis] : []))),
    empty,
  }
}

export type { Filters }
