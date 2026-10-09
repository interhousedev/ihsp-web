// Course workspaces: the notebook of an LMS course, the draft outline for pickers and the Apply actions.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  ApplyBody,
  ApplyPreview,
  ApplyResult,
  CourseOutline,
  CourseWorkspace,
  CourseWorkspaceBody,
} from "../types/course-workspace"
import type { NotebookUsage } from "../types/notebooks"

/** POST /v1/notebooks/course-workspaces — get-or-create the workspace of a course (creating needs `edit`). */
export function postCourseWorkspace(body: CourseWorkspaceBody, opts?: RequestOptions): Promise<CourseWorkspace> {
  return api.post<CourseWorkspace>("/v1/notebooks/course-workspaces", body, opts)
}

/** GET /v1/notebooks/{id}/usage — the budget and quotas of the pool that applies to this notebook. */
export function getNotebookUsageOf(id: string, opts?: RequestOptions): Promise<NotebookUsage> {
  return api.get<NotebookUsage>(`/v1/notebooks/${seg(id)}/usage`, opts)
}
export const getNotebookUsageOfQuery = (id: string) =>
  queryOptions({ queryKey: keys.notebooks.usageOf(id), queryFn: ({ signal }) => getNotebookUsageOf(id, { signal }) })

/** GET /v1/notebooks/{id}/course-steps — the draft outline of the workspace's course. */
export function getCourseSteps(id: string, opts?: RequestOptions): Promise<CourseOutline> {
  return api.get<CourseOutline>(`/v1/notebooks/${seg(id)}/course-steps`, opts)
}
export const getCourseStepsQuery = (id: string) =>
  queryOptions({ queryKey: keys.notebooks.courseSteps(id), queryFn: ({ signal }) => getCourseSteps(id, { signal }) })

/** POST /v1/notebooks/{id}/artifacts/{aid}/apply-preview — what Apply would change; nothing is written. */
export function postApplyPreview(
  id: string,
  artifactId: string,
  body: ApplyBody,
  opts?: RequestOptions,
): Promise<ApplyPreview> {
  return api.post<ApplyPreview>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/apply-preview`, body, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/apply — writes the output into the course draft (409 on a stale lock). */
export function postApplyArtifact(
  id: string,
  artifactId: string,
  body: ApplyBody,
  opts?: RequestOptions,
): Promise<ApplyResult> {
  return api.post<ApplyResult>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/apply`, body, opts)
}
