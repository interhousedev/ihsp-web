// Typed adapter for the teacher AI tools, the question bank and media jobs.
// `@ihsp/api` has no endpoint module for these routes yet; the shapes follow the served contract
// (`/v1/teacher/ai/*`, `/v1/teacher/question-bank/*`, `/v1/media/jobs*`, `/v1/staff/subjects`).

import { api, seg } from "@ihsp/api"

export type Difficulty = "easy" | "medium" | "hard"
export type Visibility = "teacher" | "subject"

export type StaffSubject = { subject_id: string; name: string; groups: { id: string; name: string }[] }

export type QuestionItem = { question: string; answer: string; options: string[]; explanation: string | null }

export type CheckWorkBody = {
  submission_id?: string
  assignment?: string
  student_work?: string
  rubric?: string
  max_score?: number
  language?: string
  subject_id?: string
  group_id?: string | null
}
export type CheckWorkResult = {
  summary: string
  score: number | null
  max_score: number | null
  strengths: string[]
  issues: string[]
  suggestions: string[]
}
export type AuthorshipVerdict = "low" | "mid" | "high"
export type AuthorshipResult = { verdict: AuthorshipVerdict | string; ai_likelihood: number; signals: string[]; caveat: string }

export type BankQuestion = {
  id: string
  topic: string
  question: string
  answer: string
  options: string[]
  explanation: string | null
  difficulty: Difficulty
  visibility: Visibility
  origin: string
}

export type MediaKind = "video_with_voice" | "audio_only"
export type MediaStatus = "queued" | "voicing" | "rendering" | "done" | "failed"
export type MediaJob = {
  id: string
  kind: MediaKind
  status: MediaStatus
  subject_id: string
  group_id: string | null
  file_id: string | null
  error: string | null
}
export type MediaJobBody = {
  subject_id: string
  group_id?: string | null
  kind?: MediaKind
  language?: string
  length?: string
  speed?: number
  style?: string
  voice_id?: string
  script: { id: string; speaker?: string; text: string; source_refs?: string[] }[]
}

type StaffSubjectDto = { subject_id: string; name: string; groups: { group_id: string; group_name: string; subgroup: number | null }[] }

export const getStaffSubjects = async (): Promise<StaffSubject[]> =>
  (await api.get<StaffSubjectDto[]>("/v1/staff/subjects")).map((s) => ({
    subject_id: s.subject_id,
    name: s.name,
    groups: s.groups.map((g) => ({ id: g.group_id, name: g.subgroup ? `${g.group_name} · ${g.subgroup}` : g.group_name })),
  }))

export const generateQuestions = (body: {
  topic: string
  subject_id: string
  group_id?: string | null
  count?: number
  question_type?: "multiple_choice" | "short_answer" | "true_false" | "mixed"
  level?: string
  language?: string
  source_text?: string
}) => api.post<{ questions: QuestionItem[] }>("/v1/teacher/ai/questions", body)

export const generateHandout = (body: {
  topic: string
  subject_id: string
  group_id?: string | null
  level?: string
  language?: string
  length?: "short" | "medium" | "long"
  source_text?: string
}) => api.post<{ title: string; markdown: string }>("/v1/teacher/ai/handout", body)

export const generateLessonPlan = (body: {
  topic: string
  subject_id: string
  group_id?: string | null
  lesson_id?: string | null
  template_id?: string | null
  duration_minutes?: number
  language?: string
  notes?: string
}) => api.post<{ id: string; title: string; markdown: string }>("/v1/teacher/ai/lesson-plan", body)

export const checkWork = (body: CheckWorkBody) => api.post<CheckWorkResult>("/v1/teacher/ai/work-check", body)

export const checkAuthorship = (body: { submission_id?: string; text?: string; context?: string; language?: string }) =>
  api.post<AuthorshipResult>("/v1/teacher/ai/authorship-check", body)

export const getBankTopics = (subjectId: string) =>
  api.get<{ topic: string; count: number }[]>(`/v1/teacher/question-bank/subjects/${seg(subjectId)}/topics`)

export const getCurriculumTopics = (subjectId: string) =>
  api.get<{ topic: string; grade: number | null }[]>(
    `/v1/teacher/question-bank/subjects/${seg(subjectId)}/curriculum-topics`,
  )

export const listBankQuestions = (subjectId: string, q: { topic?: string; limit: number; offset: number }) =>
  api.get<{ items: BankQuestion[]; total: number }>(
    `/v1/teacher/question-bank/subjects/${seg(subjectId)}/questions?${new URLSearchParams({
      limit: String(q.limit),
      offset: String(q.offset),
      ...(q.topic ? { topic: q.topic } : {}),
    })}`,
  )

export const editBankQuestion = (
  id: string,
  body: { question: string; answer: string; options?: string[]; explanation?: string | null; difficulty?: Difficulty | null },
) => api.put<BankQuestion>(`/v1/teacher/question-bank/questions/${seg(id)}`, body)

export const deleteBankQuestion = (id: string) => api.delete<void>(`/v1/teacher/question-bank/questions/${seg(id)}`)

export const drawFromBank = (
  subjectId: string,
  body: { topic: string; count: number; difficulty?: Difficulty | null; seed?: number | null },
) => api.post<BankQuestion[]>(`/v1/teacher/question-bank/subjects/${seg(subjectId)}/draw`, body)

export const saveToBank = (
  subjectId: string,
  body: { topic: string; questions: QuestionItem[]; difficulty?: Difficulty; visibility?: Visibility },
) => api.post<{ saved: number; skipped: number }>(`/v1/teacher/question-bank/subjects/${seg(subjectId)}/questions`, body)

export const setQuestionVisibility = (questionId: string, visibility: Visibility) =>
  api.put<void>(`/v1/teacher/question-bank/questions/${seg(questionId)}/visibility`, { visibility })

export const createMediaJob = (body: MediaJobBody) => api.post<MediaJob>("/v1/media/jobs", body)
export const getMediaJob = (id: string) => api.get<MediaJob>(`/v1/media/jobs/${seg(id)}`)
export const cancelMediaJob = (id: string) => api.post<MediaJob>(`/v1/media/jobs/${seg(id)}:cancel`, {})
export const listMediaJobs = (limit = 20) => api.get<{ items: MediaJob[]; total: number }>(`/v1/media/jobs?limit=${limit}`)
export const retryMediaJob = (id: string) => api.post<MediaJob>(`/v1/media/jobs/${seg(id)}:retry`, {})
