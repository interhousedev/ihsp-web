// Career exploration and voice endpoints (`/v1/admission/career*`, `/v1/admission/voice*`).

import {
  type AdmissionCareerMajor,
  type AdmissionCareerPlan,
  type AdmissionCareerQuestion,
  type AdmissionCareerSpikeIn,
  api,
  queryOptions,
} from "@ihsp/api"

export type CareerQuestion = AdmissionCareerQuestion
export type CareerSection = CareerQuestion["section"]
export type CareerMajor = AdmissionCareerMajor
export type CareerPlan = AdmissionCareerPlan
export type Profession = CareerPlan["professions"][number]
export type MajorFit = CareerPlan["fit"][number]
export type Spike = NonNullable<CareerPlan["spike"]>
export type SpikeEvidence = Spike["evidence"][number]
export type SpikeIn = Omit<AdmissionCareerSpikeIn, "lock_version">

const BASE = "/v1/admission/career"

export const careerKeys = {
  plan: () => ["admission", "career", "plan"] as const,
  questions: () => ["admission", "career", "questions"] as const,
  majors: () => ["admission", "career", "majors"] as const,
}

export const careerPlanQuery = () =>
  queryOptions({ queryKey: careerKeys.plan(), queryFn: ({ signal }) => api.get<CareerPlan>(BASE, { signal }) })
export const careerQuestionsQuery = () =>
  queryOptions({
    queryKey: careerKeys.questions(),
    queryFn: ({ signal }) => api.get<{ items: CareerQuestion[] }>(`${BASE}/questions`, { signal }),
    staleTime: 5 * 60_000,
  })
export const careerMajorsQuery = () =>
  queryOptions({
    queryKey: careerKeys.majors(),
    queryFn: ({ signal }) => api.get<{ items: CareerMajor[] }>(`${BASE}/majors`, { signal }),
    staleTime: 5 * 60_000,
  })

export const putAnswers = (answers: Record<string, string>, lock_version: number) =>
  api.put<CareerPlan>(`${BASE}/answers`, { answers, lock_version })
export const putShortlist = (titles: string[], lock_version: number) =>
  api.put<CareerPlan>(`${BASE}/shortlist`, { titles, lock_version })
export const putChoice = (majors: string[], minors: string[], lock_version: number) =>
  api.put<CareerPlan>(`${BASE}/choice`, { majors, minors, lock_version })
export const putSpike = (spike: SpikeIn, lock_version: number) =>
  api.put<CareerPlan>(`${BASE}/spike`, { ...spike, lock_version })

/** The app locale, not the browser's: the backend writes and speaks in it. */
const lang = (locale: string) => ({ headers: { "Accept-Language": locale } })

export type SuggestKind = "professions" | "fit" | "spike"
const SUGGEST_PATH: Record<SuggestKind, string> = {
  professions: `${BASE}/professions/suggest`,
  fit: `${BASE}/majors/fit`,
  spike: `${BASE}/spike/suggest`,
}
export const suggest = (kind: SuggestKind, locale: string) =>
  api.post<CareerPlan>(SUGGEST_PATH[kind], undefined, lang(locale))

/** The audio is sent as the raw body; the backend keeps only the text. */
export const transcribe = (audio: Blob, durationSeconds: number, locale: string) =>
  api.request<{ text: string }>({
    method: "POST",
    path: "/v1/admission/voice/transcriptions",
    blob: audio,
    query: { duration_seconds: Math.round(durationSeconds * 10) / 10 },
    ...lang(locale),
  })

/** WAV audio of a stored question, read aloud in the given locale. */
export const questionSpeech = (questionId: string, locale: string) =>
  api.request<Blob>({
    method: "POST",
    path: "/v1/admission/voice/speech",
    body: { question_id: questionId },
    responseType: "blob",
    ...lang(locale),
  })

/** The localized text, falling back to English, then any locale. */
export const pick = (text: Record<string, string>, locale: string) =>
  text[locale] || text.en || Object.values(text)[0] || ""
