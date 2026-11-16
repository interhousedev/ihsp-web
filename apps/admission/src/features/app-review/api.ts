"use client"

import { type AdmissionReview, type AdmissionReviewList, getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export const SECTION_KEYS = [
  "profile",
  "activities",
  "alignment",
  "essays",
  "academics",
  "universities",
  "readiness",
] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

export type AppReview = AdmissionReview
export type ReviewStatus = AppReview["status"]
export type SectionStatus = "pending" | "running" | "done" | "failed" | "skipped"
export type ReviewSection = Omit<AppReview["sections"][number], "status"> & { status: SectionStatus }
export type ReviewFinding = ReviewSection["findings"][number]
export type ReviewReport = NonNullable<AppReview["report"]>
export type ReviewPoint = ReviewReport["strengths"][number]
export type ReviewAction = ReviewReport["next_actions"][number]
export type ReviewScore = ReviewReport["section_scores"][number]

const BASE = "/v1/admission/me/application-reviews"
export const REVIEWS_KEY = ["admission", "app-reviews"] as const

export const isActive = (review: AppReview | undefined) => review?.status === "queued" || review?.status === "running"

export async function fetchReviews(): Promise<AppReview[]> {
  return (await getApiClient().get<AdmissionReviewList>(BASE)).items
}

export function fetchReview(id: string): Promise<AppReview> {
  return getApiClient().get<AppReview>(`${BASE}/${encodeURIComponent(id)}`)
}

export function startReview(): Promise<AppReview> {
  return getApiClient().post<AppReview>(BASE)
}

/** Staff read of one student's reviews (counselor or admin in scope). */
export async function fetchStudentReviews(studentId: string): Promise<AppReview[]> {
  const path = `/v1/admission/students/${encodeURIComponent(studentId)}/application-reviews`
  return (await getApiClient().get<AdmissionReviewList>(path)).items
}

/** History, newest first; polls every 3 s while the latest review is queued or running. */
export function useReviews() {
  return useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: fetchReviews,
    refetchInterval: (query) => (isActive(query.state.data?.[0]) ? 3000 : false),
  })
}

/** A student's staff-visible versions (read-only); polls every 10 s, every 3 s while the latest one runs. */
export function useStudentReviews(studentId: string) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, "student", studentId],
    queryFn: () => fetchStudentReviews(studentId),
    // Staff do not start reviews: keep looking while the tab is open (react-query pauses it in a hidden tab).
    refetchInterval: (query) => (isActive(query.state.data?.[0]) ? 3000 : 10000),
  })
}
