import type { FactKey } from "../countries/api"

/** Fact keys the staff editor offers: the display facts of the student view plus the two nested ones. */
export const EDIT_KEYS = [
  "cost_of_living",
  "climate",
  "opportunities",
  "student_visa",
  "safety",
  "bureaucracy",
  "travel_reach",
  "transport",
  "work_rights",
  "post_study",
  "language",
  "flights_tashkent",
  "community",
  "health",
  "aid",
  "tolerance",
  "employers",
  "salaries",
] as const
export type EditKey = (typeof EDIT_KEYS)[number]
export const isEditKey = (k: string): k is FactKey | EditKey => (EDIT_KEYS as readonly string[]).includes(k)

/** Backend `OPPORTUNITY_FIELDS`. */
export const OPPORTUNITY_FIELDS = [
  "cs_it",
  "engineering",
  "business_econ",
  "medicine_bio",
  "natural_sci",
  "social_law",
  "arts_media",
  "education_hum",
] as const
export const EMPLOYERS_MAX = 12
export const SOURCES_MAX = 8
export const SALARY_MAX = 10_000_000

export const CURRENCIES = ["usd", "eur", "gbp", "cad", "aud", "chf", "jpy", "krw", "cny", "aed", "try", "kzt", "pln"]

type Period = "month" | "year" | "hour" | null
/** One kind of number or text a fact may hold. `money` rows carry a currency that is part of the stored key. */
export type Entry =
  | { id: string; kind: "number" | "text" | "bool" | "score" }
  | { id: string; kind: "money"; key: (cur: string) => string; period: Period }

const num = (id: string): Entry => ({ id, kind: "number" })
const text = (id: string): Entry => ({ id, kind: "text" })
const money = (id: string, key: (cur: string) => string, period: Period): Entry => ({ id, kind: "money", key, period })

/** Entries per fact; a fact absent here only has its score and text. */
export const ENTRIES: Partial<Record<EditKey, Entry[]>> = {
  cost_of_living: [
    money("monthly_student", (c) => `monthly_${c}_student`, "month"),
    money("min_wage", (c) => `min_wage_${c}_month`, "month"),
    money("min_hourly_wage", (c) => `min_hourly_wage_${c}`, "hour"),
    money("blocked_account", (c) => `blocked_account_${c}_year`, "year"),
    text("basis"),
  ],
  climate: [num("avg_c_winter"), num("avg_c_summer"), text("koppen")],
  student_visa: [num("processing_days"), money("fee", (c) => `fee_${c}`, null), text("uz_notes")],
  safety: [num("gpi_score"), num("gpi_rank")],
  bureaucracy: [text("visa_free_neighbours_for_residents")],
  travel_reach: [money("typical_hop", (c) => `typical_hop_${c}`, null)],
  work_rights: [
    num("hours_term"),
    num("hours_holiday"),
    num("days_year"),
    money("min_hourly_wage", (c) => `min_hourly_wage_${c}`, "hour"),
  ],
  post_study: [text("visa_name"), num("months")],
  language: [num("ef_epi_score"), text("ef_epi_band"), text("local_languages")],
  flights_tashkent: [{ id: "direct", kind: "bool" }, text("cities"), num("hours"), num("tz_diff_hours")],
  health: [money("insurance", (c) => `insurance_${c}_year`, "year")],
}

/** Always-present 1-5 scores of a fact (the value names are fixed by the backend). */
export const FIXED_SCORES: Partial<Record<EditKey, string[]>> = {
  opportunities: [...OPPORTUNITY_FIELDS],
  transport: ["domestic_rail", "domestic_bus", "domestic_air", "international"],
  community: ["uzbek_diaspora", "halal"],
}

/** One editable value row: which entry, its currency (money only) and the typed text. */
export type Row = { entry: string; cur: string; value: string; other?: string }
export type Employer = { name: string; sector: string; url: string }
export type Salary = {
  year: string
  overall: string
  by: Record<string, string>
}
export type Draft = {
  score: string
  rows: Row[]
  scores: Record<string, string>
  employers: Record<string, Employer[]>
  salary: Salary
  text: Record<"en" | "ru" | "uz", string>
  sources: string[]
}

const emptySalary = (): Salary => ({
  year: String(new Date().getFullYear()),
  overall: "",
  by: {},
})
export const emptyDraft = (): Draft => ({
  score: "",
  rows: [],
  scores: {},
  employers: {},
  salary: emptySalary(),
  text: { en: "", ru: "", uz: "" },
  sources: [],
})

type Stored = {
  score: number | null
  values: Record<string, unknown>
  text: { en?: string; ru?: string; uz?: string }
  sources: string[]
}

function parseRow(entries: Entry[], name: string, value: unknown): Row {
  for (const e of entries) {
    if (e.kind === "money") {
      const cur = CURRENCIES.find((c) => e.key(c) === name)
      if (cur) return { entry: e.id, cur, value: String(value) }
    } else if (e.id === name) {
      return {
        entry: e.id,
        cur: "",
        value: typeof value === "boolean" ? (value ? "yes" : "no") : String(value),
      }
    }
  }
  return {
    entry: "",
    cur: "",
    value: typeof value === "boolean" ? (value ? "yes" : "no") : String(value),
    other: name,
  }
}

export function toDraft(k: EditKey, f?: Stored | null): Draft {
  const d = emptyDraft()
  if (!f) return d
  d.score = f.score === null ? "" : String(f.score)
  d.text = { en: f.text.en ?? "", ru: f.text.ru ?? "", uz: f.text.uz ?? "" }
  d.sources = [...f.sources]
  const v = f.values
  if (k === "employers") {
    const fields = (v.fields ?? {}) as Record<string, { name: string; sector?: string; url?: string }[]>
    for (const [fk, list] of Object.entries(fields))
      d.employers[fk] = list.map((e) => ({
        name: e.name,
        sector: e.sector ?? "",
        url: e.url ?? "",
      }))
  } else if (k === "salaries") {
    d.salary = {
      year: v.year == null ? d.salary.year : String(v.year),
      overall: v.overall_median_annual == null ? "" : String(v.overall_median_annual),
      by: Object.fromEntries(
        Object.entries((v.by_field ?? {}) as Record<string, number>).map(([a, b]) => [a, String(b)]),
      ),
    }
  } else if (FIXED_SCORES[k]) {
    d.scores = Object.fromEntries(Object.entries(v).map(([a, b]) => [a, String(b)]))
  } else {
    d.rows = Object.entries(v).map(([name, value]) => parseRow(ENTRIES[k] ?? [], name, value))
  }
  return d
}

const toNumber = (s: string): number | null => {
  const n = Number(s.trim().replace(",", "."))
  return s.trim() !== "" && Number.isFinite(n) ? n : null
}
const isHttps = (s: string) => {
  try {
    return new URL(s).protocol === "https:" && s.length <= 500
  } catch {
    return false
  }
}

export type Problem =
  | "number"
  | "money"
  | "employerName"
  | "employerUrl"
  | "salaryYear"
  | "salaryAmount"
  | "source"
  | "sourceRequired"
export type Built = {
  fact: {
    score: number | null
    values: Record<string, unknown>
    text: Draft["text"]
    sources: string[]
  } | null
  problems: Problem[]
}

/** The wire fact of one draft; `fact` is null when nothing is filled in, `problems` lists what blocks saving. */
export function buildFact(k: EditKey, d: Draft): Built {
  const problems = new Set<Problem>()
  const values: Record<string, unknown> = {}
  const entries = ENTRIES[k] ?? []
  if (k === "employers") {
    const fields: Record<string, unknown[]> = {}
    for (const [fk, list] of Object.entries(d.employers)) {
      const out = list
        .filter((e) => e.name.trim() || e.sector.trim() || e.url.trim())
        .map((e) => {
          if (!e.name.trim()) problems.add("employerName")
          if (e.url.trim() && !isHttps(e.url.trim())) problems.add("employerUrl")
          return {
            name: e.name.trim(),
            ...(e.sector.trim() ? { sector: e.sector.trim() } : {}),
            ...(e.url.trim() ? { url: e.url.trim() } : {}),
          }
        })
      if (out.length) fields[fk] = out
    }
    if (Object.keys(fields).length) values.fields = fields
  } else if (k === "salaries") {
    const by: Record<string, number> = {}
    const amount = (s: string) => {
      const n = toNumber(s)
      if (n === null || n <= 0 || n > SALARY_MAX) problems.add("salaryAmount")
      return n
    }
    const overall = d.salary.overall.trim() ? amount(d.salary.overall) : null
    for (const [fk, s] of Object.entries(d.salary.by)) {
      if (!s.trim()) continue
      const n = amount(s)
      if (n !== null) by[fk] = n
    }
    if (overall !== null || Object.keys(by).length || problems.has("salaryAmount")) {
      const year = toNumber(d.salary.year)
      if (year === null || !Number.isInteger(year) || year < 2000 || year > 2100) problems.add("salaryYear")
      Object.assign(values, {
        currency: "USD",
        year,
        overall_median_annual: overall,
        by_field: by,
      })
    }
  } else if (FIXED_SCORES[k]) {
    for (const [name, s] of Object.entries(d.scores)) if (s) values[name] = Number(s)
  } else {
    for (const r of d.rows) {
      if (r.value.trim() === "") continue
      const e = entries.find((x) => x.id === r.entry)
      const name = e ? (e.kind === "money" ? e.key(r.cur) : e.id) : (r.other ?? "")
      if (!name) continue
      if (e?.kind === "bool" || (!e && (r.value === "yes" || r.value === "no"))) values[name] = r.value === "yes"
      else if (e?.kind === "text" || (!e && toNumber(r.value) === null)) values[name] = r.value.trim()
      else {
        const n = toNumber(r.value)
        if (n === null || (e?.kind === "money" && n <= 0)) problems.add(e?.kind === "money" ? "money" : "number")
        else values[name] = n
      }
    }
  }
  const sources = [...new Set(d.sources.map((s) => s.trim()).filter(Boolean))]
  if (sources.some((s) => !isHttps(s))) problems.add("source")
  const score = d.score === "" ? null : Number(d.score)
  const empty =
    score === null && !Object.keys(values).length && !(["en", "ru", "uz"] as const).some((l) => d.text[l].trim())
  if (empty)
    return {
      fact: null,
      problems: [...problems].filter((p) => p !== "source"),
    }
  if ((score !== null || Object.keys(values).length) && sources.length === 0) problems.add("sourceRequired")
  return {
    fact: { score, values, text: d.text, sources },
    problems: [...problems],
  }
}

export const humanize = (name: string) => {
  const s = name.replaceAll("_", " ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}
