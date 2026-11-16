// Mentoring opt-in switches (admission_get_mentoring, admission_set_mentee_opt_in, admission_set_mentor_opt_in).

import { api, queryOptions, type AdmissionMentoring as Mentoring } from "@ihsp/api"

export const mentoringKeys = { state: () => ["admission", "mentoring"] as const }

export const mentoringQuery = () =>
  queryOptions({
    queryKey: mentoringKeys.state(),
    queryFn: ({ signal }) => api.get<Mentoring>("/v1/admission/mentoring", { signal }),
  })

export const putMenteeOptIn = (enabled: boolean) => api.put<Mentoring>("/v1/admission/mentoring/mentee", { enabled })
export const putMentorOptIn = (enabled: boolean) => api.put<Mentoring>("/v1/admission/mentoring/mentor", { enabled })
