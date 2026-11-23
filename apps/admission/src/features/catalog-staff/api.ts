"use client"

import {
  type AdmissionCatalogFact,
  type AdmissionCatalogFactIn,
  type AdmissionFactSpec,
  type AdmissionFactSpecGroup,
  type AdmissionFactSpecItem,
  type AdmissionLogoPatchIn,
  type AdmissionSuppCycle,
  type AdmissionSuppPromptIn,
  ApiError,
  type PersonalTokenCreated,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const SPEC = "/v1/admission/staff/catalog/fact-spec"
const BASE = "/v1/admission/staff/catalog/proposals"

/** One proposed fact as the server returns it. */
export type ProposalFact = AdmissionCatalogFact
export type FactSpec = AdmissionFactSpec
export type FactSpecGroup = AdmissionFactSpecGroup
export type FactSpecItem = AdmissionFactSpecItem

export type ProposalKind = "institution" | "scholarship"
export type ProposalStatus = "pending" | "approved" | "rejected"

export type ProposalSuppPrompt = {
  cycle: string
  prompt: string
  word_limit: number | null
  required: boolean
  source_url: string
}

export type Proposal = {
  id: string
  kind: ProposalKind
  target_id: string | null
  fields: Record<string, unknown>
  source_url: string
  note: string | null
  status: ProposalStatus
  proposed_by: string
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  applied_id: string | null
  lock_version: number
  facts?: Record<string, ProposalFact>
  supp_prompts?: ProposalSuppPrompt[]
}

export type ProposalList = { items: Proposal[]; can_review: boolean }

export type ProposalInput = {
  kind: ProposalKind
  target_id?: string | null
  fields: Record<string, unknown>
  source_url: string
  note?: string | null
  facts?: Record<string, AdmissionCatalogFactIn>
}

export const PROPOSALS_KEY = ["admission", "catalog-proposals"] as const

export function useProposals(status: ProposalStatus | null) {
  return useQuery({
    queryKey: [...PROPOSALS_KEY, status] as const,
    queryFn: () => getApiClient().get<ProposalList>(BASE, { query: status ? { status } : {} }),
  })
}

export function useCreateProposal() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: ProposalInput) => getApiClient().post<Proposal>(BASE, body),
    onSuccess: () => client.invalidateQueries({ queryKey: PROPOSALS_KEY }),
  })
}

export function useReviewProposal() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; approve: boolean; note?: string | null; lock_version: number }) =>
      getApiClient().post<Proposal>(`${BASE}/${encodeURIComponent(id)}/review`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: PROPOSALS_KEY }),
  })
}

/** GET /staff/catalog/fact-spec: the facts the form can fill, labelled in the request language (Accept-Language). */
export function useFactSpec() {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "catalog-fact-spec", locale] as const,
    queryFn: ({ signal }) => getApiClient().get<FactSpec>(SPEC, { headers: { "Accept-Language": locale }, signal }),
    staleTime: 30 * 60_000,
  })
}

export type InstitutionHit = { id: string; name: string; country: string }

/** Hits whose name matches the query (prefix first, then substring), at most `limit`; the catalog also matches cities and fields. */
export function rankByName(hits: InstitutionHit[], q: string, limit = 8): InstitutionHit[] {
  const needle = q.trim().toLowerCase()
  const rank = (hit: InstitutionHit) => {
    const name = hit.name.toLowerCase()
    return name.startsWith(needle)
      ? 0
      : name.split(/[\s,-]+/).some((w) => w.startsWith(needle))
        ? 1
        : name.includes(needle)
          ? 2
          : 3
  }
  return hits
    .filter((hit) => rank(hit) < 3)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit)
}

export function useInstitutionSearch(q: string) {
  return useQuery({
    queryKey: ["admission", "catalog-proposal-institutions", q] as const,
    enabled: q.trim().length >= 2,
    queryFn: ({ signal }) =>
      getApiClient()
        .get<{ items: InstitutionHit[] }>("/v1/admission/catalog/institutions", {
          query: { q: q.trim(), limit: 30 },
          signal,
        })
        .then((page) => rankByName(page.items, q)),
  })
}

export type LogoPatch = AdmissionLogoPatchIn

/** PATCH /staff/catalog/institutions/{id}: how the logo is shown, saved directly. */
export function usePatchLogo() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: LogoPatch & { id: string }) =>
      getApiClient().patch(`/v1/admission/staff/catalog/institutions/${encodeURIComponent(id)}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admission"] }),
  })
}

export type SuppCycle = AdmissionSuppCycle
export type SuppPromptInput = AdmissionSuppPromptIn

const suppKey = (id: string) => ["admission", "supp-prompts", id] as const

/** Every cycle of a college's supplemental prompts, newest first. */
export function useSuppCycles(id: string | null) {
  return useQuery({
    queryKey: suppKey(id ?? ""),
    enabled: !!id,
    queryFn: ({ signal }) =>
      getApiClient().get<SuppCycle[]>(`/v1/admission/catalog/institutions/${seg(id ?? "")}/supp-prompts`, { signal }),
  })
}

/** PUT /staff/catalog/institutions/{id}/supp-prompts/{cycle}: replaces the prompts of one cycle. */
export function usePutSuppPrompts() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cycle, prompts }: { id: string; cycle: string; prompts: SuppPromptInput[] }) =>
      getApiClient().put<SuppCycle[]>(
        `/v1/admission/staff/catalog/institutions/${seg(id)}/supp-prompts/${seg(cycle)}`,
        { prompts },
      ),
    onSuccess: (cycles, { id }) => client.setQueryData(suppKey(id), cycles),
  })
}

/** `admission:catalog` reads and proposes; `admission:catalog-write` only pushes country facts and institutions. */
export const CATALOG_TOKEN_SCOPES = ["admission:catalog", "admission:catalog-write"] as const
export type CatalogTokenScope = (typeof CATALOG_TOKEN_SCOPES)[number]

export type CatalogTokenInput = { name: string; scope: CatalogTokenScope; expires_in_days: number; otp_code: string }

/** Thrown when the one-time code is wrong; the session stays signed in. */
export class OtpInvalidError extends Error {}

/** POST /v1/id/personal-tokens: a wrong code answers 401 `auth/otp-invalid`, which keeps the session signed in. */
export async function createCatalogToken({ scope, ...input }: CatalogTokenInput): Promise<PersonalTokenCreated> {
  try {
    return await getApiClient().post<PersonalTokenCreated>("/v1/id/personal-tokens", {
      ...input,
      scopes: [scope],
    })
  } catch (error) {
    if (error instanceof ApiError && error.type === "auth/otp-invalid") throw new OtpInvalidError()
    throw error
  }
}
