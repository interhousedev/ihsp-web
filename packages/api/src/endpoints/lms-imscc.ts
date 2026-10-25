// LMS — IMS Common Cartridge (.imscc) import and export.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

// TODO(contract): replace with generated types once the backend publishes the routes.
export type ImsccImportStarted = { job_id: string }

export type ImsccImportStatus = "queued" | "running" | "stopping" | "done" | "failed" | "cancelled"

export type ImsccImportItem = { title: string; kind: string; note: string }

export type ImsccImportReport = {
  title: string
  sections: number
  steps: number
  files: number
  quizzes: number
  questions: number
  links: number
  /** Unsupported or partially imported items (kept as links or notes). */
  items: ImsccImportItem[]
}

export type ImsccImportJob = {
  job_id: string
  status: ImsccImportStatus
  done: number
  total: number | null
  course_id: string | null
  error: string | null
  report: ImsccImportReport | null
}

export const IMSCC_MAX_BYTES = 200 * 1024 * 1024

/** A finished job no longer changes; polling stops. */
export function isImsccJobFinished(status: ImsccImportStatus): boolean {
  return status === "done" || status === "failed" || status === "cancelled"
}

/** POST /v1/lms/courses/import — lms_admin or lms_creator; multipart field `file`; 202 with the job id. */
export function postLmsCourseImport(file: File, opts?: RequestOptions): Promise<ImsccImportStarted> {
  const form = new FormData()
  form.append("file", file)
  return api.request<ImsccImportStarted>({ ...opts, method: "POST", path: "/v1/lms/courses/import", formData: form })
}

/** GET /v1/lms/imports/{job_id}. */
export function getLmsImport(jobId: string, opts?: RequestOptions): Promise<ImsccImportJob> {
  return api.get<ImsccImportJob>(`/v1/lms/imports/${seg(jobId)}`, opts)
}
export const getLmsImportQuery = (jobId: string) =>
  queryOptions({
    queryKey: ["lms", "imports", jobId] as const,
    queryFn: ({ signal }) => getLmsImport(jobId, { signal }),
  })

/** GET /v1/lms/courses/{id}/export.imscc — course edit access; the cartridge as a `Blob`. */
export function getLmsCourseExportImscc(courseId: string, opts?: RequestOptions): Promise<Blob> {
  return api.get<Blob>(`/v1/lms/courses/${seg(courseId)}/export.imscc`, { ...opts, responseType: "blob" })
}

export type LmsCourseCopied = { course_id: string; title: string }

/** POST /v1/lms/courses/{id}/copy — course editors; a draft "<title> (copy)" owned by the caller. */
export function postLmsCourseCopy(courseId: string, opts?: RequestOptions): Promise<LmsCourseCopied> {
  return api.request<LmsCourseCopied>({ ...opts, method: "POST", path: `/v1/lms/courses/${seg(courseId)}/copy` })
}
