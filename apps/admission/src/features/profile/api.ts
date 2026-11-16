"use client"

import { getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import type { AdmissionConfig, Answers, Profile } from "./types"

export const PROFILE_KEY = ["admission", "profile"] as const
export const WIZARD_CONFIG_KEY = ["admission", "config"] as const

export function fetchWizardConfig(): Promise<AdmissionConfig> {
  return getApiClient().get<AdmissionConfig>("/v1/admission/config")
}

export function fetchProfile(): Promise<Profile> {
  return getApiClient().get<Profile>("/v1/admission/me/profile")
}

/** Partial save; a changed answer is sent with the `lock_version` it was read with. */
export function putProfile(answers: Answers, lockVersion: number | null): Promise<Profile> {
  return getApiClient().put<Profile>("/v1/admission/me/profile", { answers, lock_version: lockVersion })
}

/** The questions and option lists (same cache entry as `useAdmissionConfig`, typed for the wizard). */
export function useWizardConfig() {
  return useQuery({ queryKey: WIZARD_CONFIG_KEY, queryFn: fetchWizardConfig, staleTime: 5 * 60_000 })
}

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: fetchProfile })
}
