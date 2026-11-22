import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const base = (id: string) => `/v1/admission/staff/catalog/institutions/${encodeURIComponent(id)}`

export type CardFact = {
  key: string
  value: unknown
  source_url: string | null
  year: number | null
  note: string | null
  verified: boolean
}

export type CardScholarship = {
  id: string
  name: string
  provider: "institution" | "government" | "foundation"
  basis: "merit" | "need" | "government" | "sports" | "work_study"
  country: string | null
  coverage_pct_min: number | null
  coverage_pct_max: number | null
  covers: string[]
  url: string | null
  cycle: number | null
}

export type ScholarshipInput = Partial<Omit<CardScholarship, "id">>

export type Card = {
  lock_version: number
  facts: CardFact[]
  scholarships: CardScholarship[]
  description: Partial<Record<"uz" | "ru" | "en", string>>
}

export type CardFactInput = {
  value: unknown
  source_url: string
  year: number
  note?: string | null
  verified: boolean
}

const key = (id: string | null) => ["admission", "catalog-card", id] as const

/** GET .../institutions/{id}/facts: facts, scholarships and description with the lock to send back. */
export function useCard(id: string | null) {
  return useQuery({
    queryKey: key(id),
    enabled: id !== null,
    queryFn: ({ signal }) => getApiClient().get<Card>(`${base(id as string)}/facts`, { signal }),
  })
}

/** Writes of the card; each sends the lock read with the card and refetches it afterwards. */
export function useCardMutations(id: string) {
  const client = useQueryClient()
  const done = () => client.invalidateQueries({ queryKey: key(id) })
  const saveFacts = useMutation({
    mutationFn: (v: { lock_version: number; facts: Record<string, CardFactInput>; remove: string[] }) =>
      getApiClient().put<{ lock_version: number }>(`${base(id)}/facts`, v),
    onSuccess: done,
  })
  const saveDescription = useMutation({
    mutationFn: (v: { lock_version: number; description: Record<string, string> }) =>
      getApiClient().put<{ lock_version: number }>(`${base(id)}/description`, v),
    onSuccess: done,
  })
  const createScholarship = useMutation({
    mutationFn: (v: ScholarshipInput & { lock_version: number }) =>
      getApiClient().post<CardScholarship>(`${base(id)}/scholarships`, v),
    onSuccess: done,
  })
  const updateScholarship = useMutation({
    mutationFn: ({ sid, ...v }: ScholarshipInput & { sid: string; lock_version: number }) =>
      getApiClient().put<CardScholarship>(`${base(id)}/scholarships/${encodeURIComponent(sid)}`, v),
    onSuccess: done,
  })
  const deleteScholarship = useMutation({
    mutationFn: (v: { sid: string; lock_version: number }) =>
      getApiClient().delete<void>(
        `${base(id)}/scholarships/${encodeURIComponent(v.sid)}?lock_version=${v.lock_version}`,
      ),
    onSuccess: done,
  })
  return { saveFacts, saveDescription, createScholarship, updateScholarship, deleteScholarship, refresh: done }
}
