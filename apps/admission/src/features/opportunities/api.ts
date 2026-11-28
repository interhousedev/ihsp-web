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
  type AdmissionOpportunityDetail,
  type AdmissionOppComment,
  type AdmissionOppReport,
  type AdmissionOppReportList,
  type AdmissionOrg,
  type AdmissionOrgIn,
  type AdmissionOrgList,
  type AdmissionOrgPatch,
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

export type OpportunityDetail = AdmissionOpportunityDetail
export type OppComment = AdmissionOppComment
export type OppReport = AdmissionOppReport
export type Org = AdmissionOrg
export type OrgInput = AdmissionOrgIn
export type OrgPatch = AdmissionOrgPatch
export type AwardType = NonNullable<OpportunityFields["award_type"]>
export type Scope = NonNullable<OpportunityFields["scope"]>
export type CreditKind = NonNullable<OpportunityFields["college_credit"]>
export type OrgKind = OrgInput["kind"]

/** Orders the catalog offers; the web asks for the nearest deadline first unless the student picks another. */
export const CATALOG_SORTS = ["deadline", "relevance", "title"] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export type CatalogFilter = {
  field_id?: string
  subfield_id?: string
  subject_id?: string
  kind?: OpportunityKind
  grade?: number
  q?: string
  award_type?: AwardType
  scope?: Scope
  org_id?: string
  college_credit?: CreditKind
  delivery?: "local" | "external"
  free?: boolean
  max_tuition?: number
  max_hours?: number
  starts_within?: number
  starts_month?: number
  sort?: CatalogSort
}

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

export type PersonalEntry = Plan["personal"][number]
export type PersonalKind = PersonalEntry["kind"]
export type PersonalFields = Pick<
  PersonalEntry,
  | "kind"
  | "title"
  | "provider"
  | "url"
  | "summary"
  | "note"
  | "starts_on"
  | "ends_on"
  | "registration_deadline"
  | "planned_grade"
  | "planned_term"
>
/** Saved find, or the school list entry the backend planned instead because it matched (`merged`). */
export type PersonalAdded = {
  entry: PersonalEntry | null
  merged: boolean
  planned_opportunity_id: string | null
}

const personalPath = (id?: string) => `${BASE}/plan/personal${id ? `/${encodeURIComponent(id)}` : ""}`

export function usePersonalMutations() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: PLAN_KEY })
  return {
    add: useMutation({
      mutationFn: (body: PersonalFields & { propose: boolean }) =>
        getApiClient().post<PersonalAdded>(personalPath(), body),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: PersonalFields & { id: string; lock_version: number }) =>
        getApiClient().patch<PersonalEntry>(personalPath(id), body),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => getApiClient().delete<void>(personalPath(id)),
      onSuccess,
    }),
  }
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

const COMMENTS_KEY = [...OPPORTUNITIES_KEY, "detail"] as const
const ORGS_KEY = [...OPPORTUNITIES_KEY, "orgs"] as const
const REPORTS_KEY = [...OPPORTUNITIES_KEY, "reports"] as const
const COMMENT = "/v1/admission/opportunity-comments"
const STAFF_COMMENT = "/v1/admission/staff/opportunity-comments"
const ORG = "/v1/admission/staff/orgs"

/** GET /opportunities/{id}: the entry, its organization and its visible comments. */
export function useOpportunity(id: string | null) {
  return useQuery({
    queryKey: [...COMMENTS_KEY, id] as const,
    queryFn: ({ signal }) =>
      getApiClient().get<OpportunityDetail>(`${BASE}/${encodeURIComponent(id ?? "")}`, { signal }),
    enabled: id !== null,
  })
}

/** Comments are published at once; every mutation refreshes the detail page (and the reports queue). */
export function useCommentMutations(opportunityId: string) {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: [...COMMENTS_KEY, opportunityId] })
    void client.invalidateQueries({ queryKey: REPORTS_KEY })
  }
  const post = useMutation({
    mutationFn: (body: string) =>
      getApiClient().post<OppComment>(`${BASE}/${encodeURIComponent(opportunityId)}/comments`, { body }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${COMMENT}/${encodeURIComponent(id)}`),
    onSuccess: refresh,
  })
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      getApiClient().post<void>(`${COMMENT}/${encodeURIComponent(id)}/report`, { reason }),
  })
  const hide = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      getApiClient().post<OppComment>(`${STAFF_COMMENT}/${encodeURIComponent(id)}/${hidden ? "hide" : "unhide"}`, {}),
    onSuccess: refresh,
  })
  return { post, remove, report, hide }
}

export function useOrgs() {
  return useQuery({
    queryKey: ORGS_KEY,
    queryFn: () => getApiClient().get<AdmissionOrgList>("/v1/admission/orgs"),
  })
}

export function useOrgMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: OPPORTUNITIES_KEY })
  const create = useMutation({
    mutationFn: (body: OrgInput) => getApiClient().post<Org>(ORG, body),
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & OrgPatch) =>
      getApiClient().patch<Org>(`${ORG}/${encodeURIComponent(id)}`, body),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${ORG}/${encodeURIComponent(id)}`),
    onSuccess: refresh,
  })
  return { create, update, remove }
}

/** GET /staff/opportunities/reports: open comment reports. */
export function useReports() {
  return useQuery({
    queryKey: REPORTS_KEY,
    queryFn: () => getApiClient().get<AdmissionOppReportList>(`${STAFF}/reports`),
  })
}

export function useDismissReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().post<void>(`${STAFF}/reports/${encodeURIComponent(id)}/dismiss`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: REPORTS_KEY }),
  })
}

/** The researched draft of a "not in the list" line (`IntakeDraftIO`). */
export type IntakeDraft = {
  title: string
  summary: string
  provider: string
  kind: string
  registration_deadlines: string[]
  event_dates: string[]
  recurrence: string
  subject_ids: string[]
  url: string
  materials: { title: string; url: string }[]
  missing: string[]
  blocked: string[]
}
export type OpportunityBrief = {
  title: string
  provider: string | null
  kind: string
  url: string | null
  summary: string | null
}
export type OpportunityLookup = {
  draft: IntakeDraft
  matches: (OpportunityBrief & { id: string })[]
  pending_submission_id: string | null
}
/** The longest line the lookup accepts. */
export const LOOKUP_MAX = 300

/** Research one line (a link, or a name and an organization); needs AI consent. */
export function useOpportunityLookup() {
  return useMutation({
    mutationFn: (body: { query: string; locale: string }) =>
      getApiClient().post<OpportunityLookup>(`${BASE}/lookup`, body),
  })
}
