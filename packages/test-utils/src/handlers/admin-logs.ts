import type { LogIssue, LogIssuePage } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, query } from "./utils"

const ISSUES: LogIssue[] = [
  {
    id: "issue-1",
    title: "TypeError: Cannot read properties of undefined (reading 'id')",
    level: "error",
    count: 42,
    last_seen: "2026-10-17T08:30:00Z",
    project: "ihsp-web",
    url: "https://bugsink.example.test/issues/issue-1/",
  },
  {
    id: "issue-2",
    title: "Slow query on /v1/admin/audit",
    level: "warning",
    count: 3,
    last_seen: null,
    project: "ihsp-backend",
    url: "https://bugsink.example.test/issues/issue-2/",
  },
]

/** `GET /v1/admin/logs/issues` lists the tracked issues (enabled, two issues by default). */
export const adminLogsHandlers = [
  http.get(apiUrl("/v1/admin/logs/issues"), ({ request }) => {
    const params = query(request)
    const project = params.get("project")
    const level = params.get("level")
    const page = Number(params.get("page") ?? "1")
    const size = Number(params.get("size") ?? "20")
    const matching = ISSUES.filter(
      (issue) => (!project || issue.project === project) && (!level || issue.level === level),
    )
    const body: LogIssuePage = {
      items: matching.slice((page - 1) * size, page * size),
      page,
      size,
      has_next: page * size < matching.length,
      projects: [...new Set(ISSUES.map((issue) => issue.project))],
      disabled: false,
    }
    return HttpResponse.json(body)
  }),
]
