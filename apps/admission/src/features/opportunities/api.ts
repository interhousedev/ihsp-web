"use client"

import {
  type AdmissionAiPlan,
  type AdmissionAiPlanEnvelope,
  type AdmissionAiPlanIn,
  type AdmissionDatedEvent,
  type AdmissionMaterial,
  type AdmissionOpportunity,
  type AdmissionOpportunityFields,
  type AdmissionOpportunityList,
  type AdmissionPlan,
  type AdmissionPlanAnalytics,
  type AdmissionPlanDeadline,
  type AdmissionPlanEntry,
  type AdmissionPlanEntryIn,
  type AdmissionSubmission,
  type AdmissionSubmissionIn,
  type AdmissionSubmissionList,
  type AdmissionSubmissionReviewIn,
  type AdmissionTaxonomy,
  type AdmissionTaxonomyField,
  type AdmissionTaxonomyNode,
  type AdmissionTaxonomyNodeIn,
  type AdmissionTaxonomySubfield,
  type AdmissionTaxonomySubject,
  getApiClient,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/opportunities"
const STAFF = "/v1/admission/staff/opportunities"

export type OpportunityFields = AdmissionOpportunityFields
export type OpportunityKind = OpportunityFields["kind"]
export type Material = AdmissionMaterial
export type MaterialKind = Material["kind"]
export type Submission = AdmissionSubmission
export type SubmissionStatus = Submission["status"]
export type TaxonomyNode = AdmissionTaxonomyNode
export type TaxonomyLevel = TaxonomyNode["level"]
export type Names = Record<string, string>

export type TaxonomySubject = AdmissionTaxonomySubject
export type TaxonomySubfield = AdmissionTaxonomySubfield
export type TaxonomyField = AdmissionTaxonomyField
export type Taxonomy = AdmissionTaxonomy
export type TaxonomyNodeInput = AdmissionTaxonomyNodeIn

export type DatedEvent = AdmissionDatedEvent
export type Opportunity = AdmissionOpportunity

export type SubmissionList = AdmissionSubmissionList
export type SubmissionInput = AdmissionSubmissionIn

export type PlanEntry = AdmissionPlanEntry
export type Deadline = AdmissionPlanDeadline
export type Analytics = AdmissionPlanAnalytics
export type Plan = AdmissionPlan

export type AiPlan = AdmissionAiPlan

export type CatalogFilter = {
  field_id?: string
  subfield_id?: string
  subject_id?: string
  kind?: OpportunityKind
  grade?: number
  q?: string
}

export type ProgramExtras = {
  country?: string | null
  location?: string | null
  online?: boolean
  acceptance_rate?: number | null
  tuition_usd?: number | null
  logo_url?: string | null
  host_institution?: string | null
  duration_weeks?: number | null
  ranking?: number | null
}
export type ProgramItem = Omit<Opportunity, "fields"> & { fields: Opportunity["fields"] & ProgramExtras }
export type ProgramSort = "title" | "ranking" | "acceptance" | "tuition"
export type ProgramFilter = {
  q?: string
  country?: string
  online?: boolean
  free?: boolean
  max_tuition?: number
  sort?: ProgramSort
  page?: number
  size?: number
}
export type ProgramPage = { items: ProgramItem[]; total: number; page: number; size: number }

export const OPPORTUNITIES_KEY = ["admission", "opportunities"] as const
const TAXONOMY_KEY = [...OPPORTUNITIES_KEY, "taxonomy"] as const
const PLAN_KEY = [...OPPORTUNITIES_KEY, "plan"] as const
const SUBMISSIONS_KEY = [...OPPORTUNITIES_KEY, "submissions"] as const

/** A node's name in the UI language, falling back to any filled locale. */
export function localName(names: Names, locale: string): string {
  return names[locale] || names.en || names.ru || names.uz || Object.values(names)[0] || ""
}

export function useTaxonomy() {
  return useQuery({ queryKey: TAXONOMY_KEY, queryFn: () => getApiClient().get<Taxonomy>(`${BASE}/taxonomy`) })
}

export function useOpportunities(filter: CatalogFilter) {
  const query = Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== undefined && v !== ""))
  return useQuery({
    queryKey: [...OPPORTUNITIES_KEY, "list", query] as const,
    queryFn: ({ signal }) => getApiClient().get<AdmissionOpportunityList>(BASE, { query, signal }),
  })
}

export function usePrograms(filter: ProgramFilter) {
  const query = Object.fromEntries(
    Object.entries({ ...filter, kind: "program" }).filter(([, v]) => v !== undefined && v !== "" && v !== false),
  )
  return useQuery({
    queryKey: [...OPPORTUNITIES_KEY, "programs", query] as const,
    queryFn: ({ signal }) => getApiClient().get<ProgramPage>(BASE, { query, signal }),
    placeholderData: (prev) => prev,
  })
}

export function usePlan() {
  return useQuery({ queryKey: PLAN_KEY, queryFn: () => getApiClient().get<Plan>(`${BASE}/plan`) })
}

export function useSaveToPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & AdmissionPlanEntryIn) =>
      getApiClient().put<PlanEntry>(`${BASE}/plan/${encodeURIComponent(id)}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: PLAN_KEY }),
  })
}

export function useRemoveFromPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/plan/${encodeURIComponent(id)}`),
    onSuccess: () => client.invalidateQueries({ queryKey: PLAN_KEY }),
  })
}

const AI_KEY = [...PLAN_KEY, "ai"] as const

export function useAiPlan() {
  return useQuery({
    queryKey: AI_KEY,
    queryFn: () => getApiClient().get<AdmissionAiPlanEnvelope>(`${BASE}/plan/ai`),
  })
}

export function useGenerateAiPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: AdmissionAiPlanIn) => getApiClient().post<AdmissionAiPlan>(`${BASE}/plan/ai`, body),
    onSuccess: (plan) => client.setQueryData<AdmissionAiPlanEnvelope>(AI_KEY, { plan }),
  })
}

export function useSubmissions(status: SubmissionStatus | null) {
  return useQuery({
    queryKey: [...SUBMISSIONS_KEY, status] as const,
    queryFn: () => getApiClient().get<SubmissionList>(`${BASE}/submissions`, { query: status ? { status } : {} }),
  })
}

export function useSubmitOpportunity() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmissionInput) => getApiClient().post<Submission>(`${BASE}/submissions`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: SUBMISSIONS_KEY }),
  })
}

export function useReviewSubmission() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & AdmissionSubmissionReviewIn) =>
      getApiClient().post<Submission>(`${STAFF}/submissions/${encodeURIComponent(id)}/review`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: OPPORTUNITIES_KEY }),
  })
}

export function useArchiveOpportunity() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      getApiClient().post<void>(`${STAFF}/${encodeURIComponent(id)}/archive`, { archived }),
    onSuccess: () => client.invalidateQueries({ queryKey: OPPORTUNITIES_KEY }),
  })
}

export function useCreateTaxonomyNode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: TaxonomyNodeInput) => getApiClient().post<TaxonomyNode>(`${STAFF}/taxonomy`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: TAXONOMY_KEY }),
  })
}

export function useDeleteTaxonomyNode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${STAFF}/taxonomy/${encodeURIComponent(id)}`),
    onSuccess: () => client.invalidateQueries({ queryKey: TAXONOMY_KEY }),
  })
}
