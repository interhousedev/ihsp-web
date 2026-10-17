import type { ImsccImportJob } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, notFound } from "./utils"

const polls = new Map<string, number>()

/** Back to no running imports (call between tests that poll). */
export function resetImsccImports(): void {
  polls.clear()
}

function jobAt(jobId: string, poll: number): ImsccImportJob {
  if (poll < 1) {
    return { job_id: jobId, status: "running", done: 3, total: 10, course_id: null, error: null, report: null }
  }
  return {
    job_id: jobId,
    status: "done",
    done: 10,
    total: 10,
    course_id: "course-imported",
    error: null,
    report: {
      title: "Imported algebra",
      sections: 2,
      steps: 7,
      files: 3,
      quizzes: 1,
      questions: 4,
      links: 2,
      items: [{ title: "Discussion 1", kind: "discussion", note: "Kept as a link" }],
    },
  }
}

export const lmsImsccHandlers = [
  http.post(apiUrl("/v1/lms/courses/:id/copy"), () =>
    HttpResponse.json({ course_id: "course-copy", title: "Algebra (copy)" }, { status: 201 }),
  ),
  http.post(apiUrl("/v1/lms/courses/import"), () => HttpResponse.json({ job_id: "imp-1" }, { status: 202 })),
  http.get(apiUrl("/v1/lms/imports/:jobId"), ({ params }) => {
    const jobId = String(params.jobId)
    if (jobId === "") return notFound()
    const poll = polls.get(jobId) ?? 0
    polls.set(jobId, poll + 1)
    return HttpResponse.json(jobAt(jobId, poll))
  }),
  http.get(
    apiUrl("/v1/lms/courses/:id/export.imscc"),
    () =>
      new HttpResponse(new Uint8Array([80, 75, 3, 4]), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="course.imscc"',
        },
      }),
  ),
]
