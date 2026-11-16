/** Search filters: the address is the source of truth; every value maps to one query parameter of the catalog. */

export type Filters = {
  q: string
  country: string
  field: string
  cityType: string
  studyType: string
  /** Largest accepted crime index (safety). */
  maxCrime: string
  aid: string
  scholarships: boolean
  maxCost: string
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  country: "",
  field: "",
  cityType: "",
  studyType: "",
  maxCrime: "",
  aid: "",
  scholarships: false,
  maxCost: "",
}

export type FilterKey = keyof Filters

/** URL parameter of each filter. `cityType` and others keep the catalog's own names. */
export const FILTER_PARAM: Record<FilterKey, string> = {
  q: "q",
  country: "country",
  field: "field",
  cityType: "city_type",
  studyType: "study_type",
  maxCrime: "max_crime_index",
  aid: "aid",
  scholarships: "scholarships",
  maxCost: "max_cost",
}

export function filtersFromParams(params: URLSearchParams): Filters {
  const get = (key: FilterKey) => params.get(FILTER_PARAM[key]) ?? ""
  return {
    q: get("q"),
    country: get("country"),
    field: get("field"),
    cityType: get("cityType"),
    studyType: get("studyType"),
    maxCrime: get("maxCrime"),
    aid: get("aid"),
    scholarships: get("scholarships") === "true",
    maxCost: get("maxCost"),
  }
}

/** Only the filters that are set, as the catalog's query parameters. */
export function filtersToQuery(filters: Filters): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {}
  for (const key of Object.keys(FILTER_PARAM) as FilterKey[]) {
    const value = filters[key]
    if (value === "" || value === false) continue
    query[FILTER_PARAM[key]] = value
  }
  return query
}

export function activeFilterKeys(filters: Filters): FilterKey[] {
  return (Object.keys(FILTER_PARAM) as FilterKey[]).filter(
    (key) => key !== "q" && filters[key] !== "" && filters[key] !== false,
  )
}

export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filtersToQuery(filters))) params.set(key, String(value))
  const text = params.toString()
  return text ? `?${text}` : ""
}

/** The filters with the given ones cleared. */
export function withoutFilters(filters: Filters, keys: FilterKey[]): Filters {
  const next = { ...filters }
  for (const key of keys) (next as Record<FilterKey, string | boolean>)[key] = EMPTY_FILTERS[key]
  return next
}
