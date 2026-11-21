"use client"

import { getApiClient, isApiError } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useQuery } from "@tanstack/react-query"

type AdmissionMe = { kind: "applicant" | "staff" | "none"; entitlement_kind?: string | null }

/** The backend answers this problem type for self-only student endpoints when the caller is not an applicant. */
export const NOT_APPLICANT_TYPE = "admission/not_applicant"

export function isNotApplicant(error: unknown): boolean {
  return isApiError(error) && error.status === 403 && error.type.endsWith(NOT_APPLICANT_TYPE)
}

/**
 * Alumni are applicants without the `student` role. Only users without that role are asked (`GET /v1/admission/me`);
 * until the answer arrives, or when it fails, the user counts as not an alumnus.
 */
export function useIsAlumnus(): boolean {
  const { session } = useSession()
  const roles = session?.user.roles
  const needed = !!session && !roles?.includes("student")
  const me = useQuery({
    queryKey: ["admission", "me", "standing"],
    queryFn: ({ signal }) => getApiClient().get<AdmissionMe>("/v1/admission/me", { signal }),
    enabled: needed,
    staleTime: 5 * 60_000,
    retry: false,
  })
  return needed && me.data?.entitlement_kind === "alumni"
}

/** The signed-in student's school grade (`GET /v1/admission/me`), or null when unknown (staff, alumni, loading). */
export function useStudentGrade(): number | null {
  const me = useQuery({
    queryKey: ["admission", "me", "grade"],
    queryFn: ({ signal }) => getApiClient().get<{ grade?: number | null }>("/v1/admission/me", { signal }),
    staleTime: 5 * 60_000,
    retry: false,
  })
  return me.data?.grade ?? null
}
