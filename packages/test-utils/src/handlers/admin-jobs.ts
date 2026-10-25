import type { AdminJob } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, problem } from "./utils"

function seed(): AdminJob[] {
  return [
    {
      id: "job-1",
      kind: "academic.resync_materials",
      label: "EMIS materials 2026-2027/1",
      status: "running",
      created_at: "2026-10-06T09:00:00Z",
      started_at: "2026-10-06T09:00:05Z",
      finished_at: null,
      started_by: null,
      done: 3,
      total: 12,
      note: null,
      counters: { files: 41, links: 5 },
    },
  ]
}

let jobs = seed()

/** Back to the one running job (preload calls this after every test). */
export function resetAdminJobs(): void {
  jobs = seed()
}

/** `GET /v1/admin/jobs` lists the jobs; `POST /v1/admin/jobs/:id/cancel` stops one (queued: cancelled, running: stopping). */
export const adminJobsHandlers = [
  http.get(apiUrl("/v1/admin/jobs"), () => HttpResponse.json({ items: jobs })),
  http.post(apiUrl("/v1/admin/jobs/:id/cancel"), ({ params }) => {
    const job = jobs.find((each) => each.id === params.id)
    if (!job) return problem(404, "admin/job-not-found", "Not found")
    job.status = job.status === "queued" ? "cancelled" : "stopping"
    return HttpResponse.json(job)
  }),
]
