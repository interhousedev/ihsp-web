"use client"

import { getMeProfileQuery, isApiError } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { EMIS_AUTH_FAILED } from "../../student-card/components/student-card-error"

/** Problem type of a missing academic record (HTTP 404); the EMIS refusal (409) is `EMIS_AUTH_FAILED`. */
export const STUDENT_NOT_FOUND = "academic/student-not-found"

export type StudentRecordStatus = "loading" | "ready" | "missing" | "emis-failed" | "error"

export type StudentRecordState = {
  status: StudentRecordStatus
  /** The failed request's error for `error`; `undefined` otherwise. */
  error: unknown
  refetch: () => void
}

/** Maps the problem type of a failed request to the state a page shows. Anything else is a plain error. */
export function studentRecordStatusOf(error: unknown): "missing" | "emis-failed" | "error" {
  if (isApiError(error) && error.type === STUDENT_NOT_FOUND) return "missing"
  if (isApiError(error) && error.type === EMIS_AUTH_FAILED) return "emis-failed"
  return "error"
}

/**
 * Whether the signed-in student has a usable academic record. It reads the profile query, which every page that needs
 * the record shares, so asking from many places is one request. `missing` and `emis-failed` mean the pages show
 * `<NoStudentRecordNotice>` instead of their own error cards.
 */
export function useStudentRecordState(): StudentRecordState {
  const query = useQuery(getMeProfileQuery())
  const status: StudentRecordStatus = query.isError
    ? studentRecordStatusOf(query.error)
    : query.isSuccess
      ? "ready"
      : "loading"
  return { status, error: query.error ?? undefined, refetch: () => void query.refetch() }
}

/** True when the pages must replace their content with the no-record notice. */
export function isRecordBlocked(status: StudentRecordStatus): status is "missing" | "emis-failed" {
  return status === "missing" || status === "emis-failed"
}
