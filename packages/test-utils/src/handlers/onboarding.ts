import type { CertificateEntry, Onboarding } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

type State = { selfieDone: boolean; certificatesDone: boolean }

const INITIAL: State = { selfieDone: true, certificatesDone: true }
let state: State = { ...INITIAL }
let doneCalls = 0
let refreshCalls = 0
let emisEntries: CertificateEntry[] = []

/** What `GET /v1/me/onboarding` answers. The default is a finished student (no steps). */
export function setOnboarding(next: Partial<Pick<State, "selfieDone" | "certificatesDone">>): void {
  state = { ...state, ...next }
}

/** The entries `refresh-emis` returns. */
export function setOnboardingEmisEntries(entries: CertificateEntry[]): void {
  emisEntries = entries
}

export function onboardingCalls(): { done: number; refresh: number } {
  return { done: doneCalls, refresh: refreshCalls }
}

export function resetOnboarding(): void {
  state = { ...INITIAL }
  doneCalls = 0
  refreshCalls = 0
  emisEntries = []
}

function current(): Onboarding {
  const steps = [
    { key: "selfie" as const, required: true, done: state.selfieDone, skippable: false },
    { key: "certificates" as const, required: false, done: state.certificatesDone, skippable: true },
  ].filter((step) => !step.done)
  return { required: steps.some((step) => step.required), steps }
}

/** The face upload of the selfie step marks it done in this state too. */
export function markSelfieDone(): void {
  state = { ...state, selfieDone: true }
}

export const onboardingHandlers = [
  http.get(apiUrl("/v1/me/onboarding"), () => HttpResponse.json(current())),
  http.post(apiUrl("/v1/me/onboarding/certificates/done"), () => {
    doneCalls += 1
    state = { ...state, certificatesDone: true }
    return HttpResponse.json(current())
  }),
  http.post(apiUrl("/v1/me/onboarding/certificates/refresh-emis"), () => {
    refreshCalls += 1
    return HttpResponse.json({ entries: emisEntries })
  }),
]
