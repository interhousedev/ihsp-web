// Admin — error-tracking issues (Bugsink) for the logs page.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

export const LOG_LEVELS = ["fatal", "error", "warning", "info", "debug"] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

// TODO(contract): replace with generated
/** One tracked issue; `url` is the deep link to its page in Bugsink. */
export interface LogIssue {
  id: string
  title: string
  level: string
  count: number
  last_seen: string | null
  project: string
  url: string
}

// TODO(contract): replace with generated
export interface LogIssuePage {
  items: LogIssue[]
  page: number
  size: number
  has_next: boolean
  projects: string[]
  /** True when error tracking is not configured on the backend; `items` is then empty. */
  disabled: boolean
}

export type AdminLogIssuesParams = {
  project?: string
  level?: LogLevel
  page?: number
  size?: number
}

/** GET /v1/admin/logs/issues — admin; the issues of the error tracker, newest first. */
export function getAdminLogIssues(params?: AdminLogIssuesParams, opts?: RequestOptions): Promise<LogIssuePage> {
  return api.get<LogIssuePage>("/v1/admin/logs/issues", { ...opts, query: params })
}
export const getAdminLogIssuesQuery = (params?: AdminLogIssuesParams) =>
  queryOptions({
    queryKey: keys.admin.logs(params),
    queryFn: ({ signal }) => getAdminLogIssues(params, { signal }),
  })
