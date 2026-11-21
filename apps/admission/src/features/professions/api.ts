// Professions and ikigai endpoints (`/v1/admission/professions`, `/me/professions`, `/me/ikigai`, `/list/fit`).
// Typed by hand against the frozen contract until the generated client carries them.

import { api, queryOptions } from "@ihsp/api"

export type AiRisk = "low" | "medium" | "high"
export type Horizon = "now" | "5y" | "10y+"
export type SalaryBand = "low" | "medium" | "high"

export type Profession = {
  /** ISCO-08 four-digit code. */
  id: string
  name: string
  group: string
  /** 0..1: the share of tasks a model can already do (ILO 2025). Not a layoff forecast. */
  ai_exposure: number
  ai_risk: AiRisk
  horizon: Horizon
  salary_band: SalaryBand | null
  related_fields: string[]
  sources: { label: string; url: string }[]
}
export type MyProfession = Profession & { rank: number }

export type Ikigai = { love: string[]; good_at: string[]; needs: string[]; paid: string[] }
export type IkigaiCircle = keyof Ikigai

export type GoalsFit = {
  weights: Record<string, number>
  items: { list_entry_id: string; institution_id: string; axes: { key: string; score: number | null; weight: number }[] }[]
}

const lang = (locale: string) => ({ headers: { "Accept-Language": locale } })

export const professionKeys = {
  search: (q: string, locale: string) => ["admission", "professions", "search", q, locale] as const,
  mine: (locale: string) => ["admission", "professions", "mine", locale] as const,
  ikigai: () => ["admission", "professions", "ikigai"] as const,
  fit: () => ["admission", "list", "fit"] as const,
}

export const searchProfessionsQuery = (q: string, locale: string) =>
  queryOptions({
    queryKey: professionKeys.search(q, locale),
    queryFn: ({ signal }) =>
      api.get<{ items: Profession[] }>(`/v1/admission/professions?q=${encodeURIComponent(q)}&limit=20`, {
        signal,
        ...lang(locale),
      }),
    staleTime: 5 * 60_000,
  })

export const myProfessionsQuery = (locale: string) =>
  queryOptions({
    queryKey: professionKeys.mine(locale),
    queryFn: ({ signal }) => api.get<{ items: MyProfession[] }>("/v1/admission/me/professions", { signal, ...lang(locale) }),
  })

export const putMyProfessions = (ids: string[], locale: string) =>
  api.put<{ items: MyProfession[] }>(
    "/v1/admission/me/professions",
    { items: ids.map((profession_id, index) => ({ profession_id, rank: index + 1 })) },
    lang(locale),
  )

export const ikigaiQuery = () =>
  queryOptions({
    queryKey: professionKeys.ikigai(),
    queryFn: ({ signal }) => api.get<Ikigai>("/v1/admission/me/ikigai", { signal }),
  })

export const putIkigai = (body: Ikigai) => api.put<Ikigai>("/v1/admission/me/ikigai", body)

export const goalsFitQuery = () =>
  queryOptions({
    queryKey: professionKeys.fit(),
    queryFn: ({ signal }) => api.get<GoalsFit>("/v1/admission/list/fit", { signal }),
  })
