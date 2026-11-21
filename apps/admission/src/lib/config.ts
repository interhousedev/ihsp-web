"use client"

import { getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/**
 * Shape of `GET /v1/admission/config`: option lists, limits and flags are owned by the backend.
 * Local type until the OpenAPI document contains the route; then it is replaced by the generated type.
 */
export interface AdmissionWorkflow {
  document_kinds: { id: string; confidential: boolean }[]
  reject_reasons: string[]
  reminder_offsets: number[]
  reminder_channels: string[]
  deadline_statuses: string[]
  rounds: { id: string; binding: boolean }[]
  list_statuses: string[]
  buckets: string[]
  affordability_ack_statuses: string[]
}

export type AdmissionConfig = Record<string, unknown> & {
  item_caps?: Record<string, number>
  stages?: string[]
  workflow?: AdmissionWorkflow
}

export const ADMISSION_CONFIG_KEY = ["admission", "config"] as const

export function fetchAdmissionConfig(): Promise<AdmissionConfig> {
  return getApiClient().get<AdmissionConfig>("/v1/admission/config")
}

/** The admission configuration; it changes rarely, so it is kept fresh for five minutes. */
export function useAdmissionConfig() {
  return useQuery({ queryKey: ADMISSION_CONFIG_KEY, queryFn: fetchAdmissionConfig, staleTime: 5 * 60_000 })
}

const EMPTY: AdmissionWorkflow = {
  document_kinds: [],
  reject_reasons: [],
  reminder_offsets: [],
  reminder_channels: [],
  deadline_statuses: [],
  rounds: [],
  list_statuses: [],
  buckets: [],
  affordability_ack_statuses: [],
}

/** Workflow option lists of the backend; empty until the configuration has loaded. */
export function useWorkflow(): AdmissionWorkflow {
  return { ...EMPTY, ...useAdmissionConfig().data?.workflow }
}

/** Grades fallback until the configuration loads. */
const DEFAULT_SCHOOL_GRADES = [9, 10, 11, 12]

/** School grades in force (`school_grades` of the admission config), ascending; never empty. */
export function useSchoolGrades(): number[] {
  const grades = useAdmissionConfig().data?.school_grades
  return Array.isArray(grades) && grades.length > 0 ? (grades as number[]) : DEFAULT_SCHOOL_GRADES
}
