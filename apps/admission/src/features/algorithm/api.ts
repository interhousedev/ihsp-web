import {
  api,
  queryOptions,
  type AdmissionPreferenceAnswers as PreferenceAnswers,
  type AdmissionPreferences as Preferences,
} from "@ihsp/api"

const PATH = "/v1/admission/preferences"

export const preferencesKey = ["admission", "preferences"] as const

export const preferencesQuery = () =>
  queryOptions({ queryKey: preferencesKey, queryFn: ({ signal }) => api.get<Preferences>(PATH, { signal }) })

/** Partial update: only the given answers change. */
export const putPreferences = (answers: PreferenceAnswers) => api.put<Preferences>(PATH, answers)
