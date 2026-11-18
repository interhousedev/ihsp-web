"use client"

import {
  type AdmissionCoachExpansion,
  type AdmissionCoachCheck,
  type AdmissionCoachFeedback,
  type AdmissionCoachOutline,
  type AdmissionCoachQuestions,
  type AdmissionEssay,
  type AdmissionEssayIn,
  type AdmissionEssayLink,
  type AdmissionEssayPatch,
  type AdmissionEssaySummary,
  type AdmissionEssayVersion,
  type AdmissionIdea,
  type AdmissionIdeaIn,
  type AdmissionIdeaPatch,
  type AdmissionPlanSection,
  type AdmissionSharedEssay,
  type AdmissionSuppCycle,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** Mirrors the backend `EssayKindT` literal of the essays contract. */
export const ESSAY_KINDS = ["personal_statement", "supplemental", "other"] as const
export type EssayKind = (typeof ESSAY_KINDS)[number]
/** Mirrors `IdeaStatusT`. */
export const IDEA_STATUSES = ["explore", "keep", "drop"] as const
export type IdeaStatus = (typeof IDEA_STATUSES)[number]

export type PlanSection = AdmissionPlanSection
export type EssayLink = AdmissionEssayLink
export type Essay = AdmissionEssay
export type EssaySummary = AdmissionEssaySummary
export type EssayInput = AdmissionEssayIn
export type EssayPatch = AdmissionEssayPatch
export type EssayVersion = AdmissionEssayVersion
export type SharedEssay = AdmissionSharedEssay
export type Idea = AdmissionIdea
export type CoachQuestions = AdmissionCoachQuestions
export type CoachExpansion = AdmissionCoachExpansion
export type CoachOutline = AdmissionCoachOutline
export type CoachFeedback = AdmissionCoachFeedback
export type CoachCheck = AdmissionCoachCheck

const BASE = "/v1/admission"
export const essayKeys = {
  all: ["admission", "essays"] as const,
  list: ["admission", "essays", "list"] as const,
  one: (id: string) => ["admission", "essays", "one", id] as const,
  versions: (id: string) => ["admission", "essays", "versions", id] as const,
  shared: (studentId: string) => ["admission", "essays", "shared", studentId] as const,
  ideas: ["admission", "essays", "ideas"] as const,
}

export function useEssays() {
  return useQuery({
    queryKey: essayKeys.list,
    queryFn: ({ signal }) => getApiClient().get<{ items: EssaySummary[] }>(`${BASE}/essays`, { signal }),
  })
}

export function useEssay(id: string | null) {
  return useQuery({
    queryKey: essayKeys.one(id ?? ""),
    enabled: !!id,
    queryFn: ({ signal }) => getApiClient().get<Essay>(`${BASE}/essays/${seg(id ?? "")}`, { signal }),
  })
}

export function useCreateEssay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EssayInput) => getApiClient().post<Essay>(`${BASE}/essays`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: essayKeys.list }),
  })
}

/** Writes the server's answer into the cache so the next save carries the new `lock_version`. */
function useEssayWriter() {
  const qc = useQueryClient()
  return (essay: Essay) => {
    qc.setQueryData(essayKeys.one(essay.id), essay)
    void qc.invalidateQueries({ queryKey: essayKeys.list })
  }
}

export function useSaveEssay(id: string) {
  const write = useEssayWriter()
  return useMutation({
    mutationFn: (body: EssayPatch) => getApiClient().patch<Essay>(`${BASE}/essays/${seg(id)}`, body),
    onSuccess: write,
  })
}

export function useDeleteEssay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/essays/${seg(id)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: essayKeys.list }),
  })
}

export function useVersions(id: string) {
  return useQuery({
    queryKey: essayKeys.versions(id),
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: EssayVersion[] }>(`${BASE}/essays/${seg(id)}/versions`, { signal }),
  })
}

function useVersionsInvalidate(id: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: essayKeys.versions(id) })
}

export function useSnapshot(id: string) {
  const invalidate = useVersionsInvalidate(id)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { lock_version: number; name?: string | null }) =>
      getApiClient().post<EssayVersion>(`${BASE}/essays/${seg(id)}/versions`, body),
    onSuccess: () => {
      void invalidate()
      void qc.invalidateQueries({ queryKey: essayKeys.one(id) })
    },
  })
}

export function useRestore(id: string) {
  const write = useEssayWriter()
  const invalidate = useVersionsInvalidate(id)
  return useMutation({
    mutationFn: ({ version, lock_version }: { version: number; lock_version: number }) =>
      getApiClient().post<Essay>(`${BASE}/essays/${seg(id)}/versions/${version}/restore`, { lock_version }),
    onSuccess: (essay) => {
      write(essay)
      void invalidate()
    },
  })
}

export function useShareVersion(id: string) {
  const invalidate = useVersionsInvalidate(id)
  return useMutation({
    mutationFn: ({ version, shared }: { version: number; shared: boolean }) =>
      getApiClient().put<EssayVersion>(`${BASE}/essays/${seg(id)}/versions/${version}/share`, { shared }),
    onSuccess: invalidate,
  })
}

/** Staff: the shared versions of one student's essays within the viewer's scope. */
export function useStudentEssays(studentId: string) {
  return useQuery({
    queryKey: essayKeys.shared(studentId),
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: SharedEssay[] }>(`${BASE}/students/${seg(studentId)}/essays`, { signal }),
  })
}

export function useIdeas() {
  return useQuery({
    queryKey: essayKeys.ideas,
    queryFn: ({ signal }) => getApiClient().get<{ items: Idea[] }>(`${BASE}/essay-ideas`, { signal }),
  })
}

function useIdeasInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: essayKeys.ideas })
}

export function useAddIdea() {
  const invalidate = useIdeasInvalidate()
  return useMutation({
    mutationFn: (body: AdmissionIdeaIn) => getApiClient().post<Idea>(`${BASE}/essay-ideas`, body),
    onSuccess: invalidate,
  })
}

export function usePatchIdea() {
  const invalidate = useIdeasInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: AdmissionIdeaPatch & { id: string }) =>
      getApiClient().patch<Idea>(`${BASE}/essay-ideas/${seg(id)}`, body),
    onSettled: invalidate,
  })
}

export function useDeleteIdea() {
  const invalidate = useIdeasInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/essay-ideas/${seg(id)}`),
    onSuccess: invalidate,
  })
}

export function useExpandIdea() {
  return useMutation({
    mutationFn: (id: string) => getApiClient().post<CoachExpansion>(`${BASE}/essay-ideas/${seg(id)}/expand`, {}),
  })
}

export function useCoach<T>(id: string, helper: "brainstorm" | "outline" | "feedback") {
  const locale = useLocale()
  return useMutation({
    mutationFn: () =>
      getApiClient().post<T>(
        `${BASE}/essays/${seg(id)}/coach/${helper}`,
        {},
        { headers: { "Accept-Language": locale } },
      ),
  })
}

/** Scores the saved draft against its prompt and the six-part rubric; the locale rides on Accept-Language. */
export function useCheckEssay(id: string) {
  const locale = useLocale()
  return useMutation({
    mutationFn: () =>
      getApiClient().post<CoachCheck>(`${BASE}/essays/${seg(id)}/coach/check`, undefined, {
        headers: { "Accept-Language": locale },
      }),
  })
}

/** Mirrors `CoachReviewIn.mode`. */
export const REVIEW_MODES = ["overall", "sentences", "both", "partial"] as const
export type ReviewMode = (typeof REVIEW_MODES)[number]
/** Mirrors `CoachRefineIn.action`. */
export const REFINE_ACTIONS = ["reword", "transition", "merge"] as const
export type RefineAction = (typeof REFINE_ACTIONS)[number]

export type LifeStoryReading = { drivers: string[]; support: string[]; leave_out: string[]; ideas: string[] }

/** Reviews the saved draft in a mode; `excerpt` is the passage of the `partial` mode. */
export function useReview(id: string) {
  return useMutation({
    mutationFn: (body: { mode: ReviewMode; excerpt: string }) =>
      getApiClient().post<CoachFeedback>(`${BASE}/essays/${seg(id)}/coach/review`, body),
  })
}

/** Hints for rewording, connecting or merging one passage; the coach never returns new text. */
export function useRefine(id: string) {
  return useMutation({
    mutationFn: (body: { action: RefineAction; text: string }) =>
      getApiClient().post<{ hints: string[] }>(`${BASE}/essays/${seg(id)}/coach/refine`, body),
  })
}

export function useLifeStory() {
  return useMutation({
    mutationFn: (text: string) => getApiClient().post<LifeStoryReading>(`${BASE}/essay-life-story`, { text }),
  })
}

export type SuppCycle = AdmissionSuppCycle

/** The supplemental prompts of a college per cycle, newest first, each marked against the year before. */
export function useSuppPrompts(institutionId: string | null) {
  return useQuery({
    queryKey: ["admission", "supp-prompts", institutionId ?? ""] as const,
    enabled: !!institutionId,
    queryFn: ({ signal }) =>
      getApiClient().get<SuppCycle[]>(`${BASE}/catalog/institutions/${seg(institutionId ?? "")}/supp-prompts`, {
        signal,
      }),
  })
}
