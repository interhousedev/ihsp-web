"use client"

// `GET /v1/admission/readiness` and `GET /v1/admission/students/{id}/readiness`.

import { type AdmissionReadiness, type AdmissionReadinessWeights, getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type ReadinessComponent = Readiness["components"][number]
export type Readiness = AdmissionReadiness

export const READINESS_KEY = ["admission", "readiness"] as const

/** The caller's readiness, or a student's (staff with access) when `studentId` is given. */
export function useReadiness(studentId?: string) {
  return useQuery({
    queryKey: [...READINESS_KEY, studentId ?? "me"],
    queryFn: () =>
      getApiClient().get<Readiness>(
        studentId ? `/v1/admission/students/${seg(studentId)}/readiness` : "/v1/admission/readiness",
      ),
  })
}

const WEIGHTS_PATH = "/v1/admission/readiness/weights"

export type ReadinessWeights = AdmissionReadinessWeights

/** The weights in force (admin only). */
export function useReadinessWeights() {
  return useQuery({
    queryKey: [...READINESS_KEY, "weights"],
    queryFn: () => getApiClient().get<ReadinessWeights>(WEIGHTS_PATH),
  })
}

/** Replaces the weights; every readiness view is refetched afterwards. */
export function useSaveReadinessWeights() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: ReadinessWeights) => getApiClient().put<ReadinessWeights>(WEIGHTS_PATH, body),
    onSuccess: () => client.invalidateQueries({ queryKey: READINESS_KEY }),
  })
}
