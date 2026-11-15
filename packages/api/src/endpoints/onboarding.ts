// Student onboarding wizard (`/v1/me/onboarding`): which steps the student still has to see.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { CertificateEntry } from "../types/certificates"

export type OnboardingStepKey = "selfie" | "certificates"

export type OnboardingStep = {
  key: OnboardingStepKey
  required: boolean
  done: boolean
  skippable: boolean
}

/** `required` is true while a required step is not done; `steps` is empty for non-students and finished students. */
export type Onboarding = {
  required: boolean
  steps: OnboardingStep[]
}

export type OnboardingEmisResult = { entries: CertificateEntry[] }

/** GET /v1/me/onboarding — the steps the caller still has to see. */
export function getOnboarding(opts?: RequestOptions): Promise<Onboarding> {
  return api.get<Onboarding>("/v1/me/onboarding", opts)
}
export const getOnboardingQuery = () =>
  queryOptions({ queryKey: keys.me.onboarding(), queryFn: ({ signal }) => getOnboarding({ signal }) })

/** POST /v1/me/onboarding/certificates/done — marks the certificates step as seen (done or skipped). */
export function postOnboardingCertificatesDone(opts?: RequestOptions): Promise<Onboarding> {
  return api.post<Onboarding>("/v1/me/onboarding/certificates/done", undefined, opts)
}

/** POST /v1/me/onboarding/certificates/refresh-emis — loads the National Certificate and CEFR; `429` when rate-limited, `409 emis/auth-failed` or `emis/unavailable`. */
export function postOnboardingRefreshEmis(opts?: RequestOptions): Promise<OnboardingEmisResult> {
  return api.post<OnboardingEmisResult>("/v1/me/onboarding/certificates/refresh-emis", undefined, opts)
}
