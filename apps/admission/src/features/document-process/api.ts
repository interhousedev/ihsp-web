"use client"

import { getApiClient } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"

export type ProcessStatus = "not_started" | "requested" | "ready" | "not_tracked"

/** Mirrors `ProcessStepOut`. */
export type ProcessStep = {
  key: string
  title: string
  issuer: string
  description: string
  lead_days_min: number
  lead_days_max: number
  status: ProcessStatus
}

export function useDocumentProcess() {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "document-process", locale] as const,
    queryFn: () =>
      getApiClient().get<{ steps: ProcessStep[] }>("/v1/admission/document-process", {
        headers: { "Accept-Language": locale },
      }),
  })
}
