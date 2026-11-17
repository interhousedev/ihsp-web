/** Search filters: the address is the source of truth; every value maps to one query parameter of the catalog. */

export type SortKey = "relevance" | "name" | "cost"
export const SORTS: SortKey[] = ["relevance", "name", "cost"]

export type Filters = {
  q: string
  country: string
  /** Id of a field of study (`GET /catalog/study-fields`). */
  field: string
  setting: string
  institutionType: string
  testPolicy: string
  meritIntl: boolean
  plan: string
  /** Admission cycle such as `2026-27`. */
  cycle: string
  aid: string
  scholarships: boolean
  maxCost: string
  /** Only reorders the loaded results; the catalog has no sort parameter. */
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  country: "",
  field: "",
  setting: "",
  institutionType: "",
  testPolicy: "",
  meritIntl: false,
  plan: "",
  cycle: "",
  aid: "",
  scholarships: false,
  maxCost: "",
  sort: "relevance",
}

export type FilterKey = keyof Filters

/** URL parameter of each filter; they keep the catalog's own names. */
export const FILTER_PARAM: Record<FilterKey, string> = {
  q: "q",
  country: "country",
  field: "field",
  setting: "setting",
  institutionType: "institution_type",
  testPolicy: "test_policy",
  meritIntl: "merit_intl",
  plan: "plan",
  cycle: "cycle",
  aid: "aid",
  scholarships: "scholarships",
  maxCost: "max_cost",
  sort: "sort",
}

/** Filters that are a pick-one facet of the catalog, in the order the panel shows them. */
export const SELECT_FILTERS: { param: string; key: FilterKey }[] = [
  { param: "country", key: "country" },
  { param: "institution_type", key: "institutionType" },
  { param: "setting", key: "setting" },
  { param: "test_policy", key: "testPolicy" },
  { param: "plan", key: "plan" },
  { param: "cycle", key: "cycle" },
  { param: "aid", key: "aid" },
]

const BOOLEAN_KEYS: FilterKey[] = ["meritIntl", "scholarships"]

export function filtersFromParams(params: URLSearchParams): Filters {
  const next: Record<string, string | boolean> = {}
  for (const key of Object.keys(FILTER_PARAM) as FilterKey[]) {
    const raw = params.get(FILTER_PARAM[key]) ?? ""
    next[key] = BOOLEAN_KEYS.includes(key) ? raw === "true" : raw
  }
  const sort = SORTS.includes(next.sort as SortKey) ? (next.sort as SortKey) : "relevance"
  return { ...(next as Filters), sort }
}

const isSet = (key: FilterKey, value: string | boolean) =>
  key === "sort" ? value !== "relevance" : value !== "" && value !== false

/** Only the filters that are set, as the catalog's query parameters (sorting is done here, not by the catalog). */
export function filtersToQuery(filters: Filters): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {}
  for (const key of Object.keys(FILTER_PARAM) as FilterKey[]) {
    const value = filters[key]
    if (key === "sort" || !isSet(key, value)) continue
    query[FILTER_PARAM[key]] = value
  }
  return query
}

/** The filters shown as chips: everything set except the search text and the sort. */
export function activeFilterKeys(filters: Filters): FilterKey[] {
  return (Object.keys(FILTER_PARAM) as FilterKey[]).filter(
    (key) => key !== "q" && key !== "sort" && isSet(key, filters[key]),
  )
}

export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(FILTER_PARAM) as FilterKey[]) {
    const value = filters[key]
    if (isSet(key, value)) params.set(FILTER_PARAM[key], String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

/** The filters with the given ones cleared. */
export function withoutFilters(filters: Filters, keys: FilterKey[]): Filters {
  const next = { ...filters }
  for (const key of keys) (next as Record<FilterKey, string | boolean>)[key] = EMPTY_FILTERS[key]
  return next
}
