// LMS — H5P packages and interactive video answers.
// TODO(contract): hand-written until openapi/openapi.json of iht-backend is exported with these routes.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { H5PLaunch, H5PPackage, InteractionResult, BlockResult, XapiStatement } from "../types/lms-interactive"

/** The upload limit of the backend (`H5P_MAX_PACKAGE_BYTES`). */
export const H5P_MAX_BYTES = 100 * 1024 * 1024

/** POST /v1/lms/courses/{id}/h5p — course `edit`; multipart field `file` (a `.h5p` zip). */
export function postLmsH5PPackage(courseId: string, file: File, opts?: RequestOptions): Promise<H5PPackage> {
  const form = new FormData()
  form.append("file", file)
  return api.request<H5PPackage>({
    ...opts,
    method: "POST",
    path: `/v1/lms/courses/${seg(courseId)}/h5p`,
    formData: form,
  })
}

/** GET /v1/lms/courses/{id}/steps/{step_id}/blocks/{block_id}/h5p — enrolled or staff; signed base path. */
export function getLmsH5PLaunch(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<H5PLaunch> {
  return api.get<H5PLaunch>(`/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}/blocks/${seg(blockId)}/h5p`, opts)
}

/** GET /v1/lms/courses/{id}/preview/steps/{step_id}/blocks/{block_id}/h5p — `view_drafts`; a draft's package. */
export function getLmsPreviewH5PLaunch(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<H5PLaunch> {
  return api.get<H5PLaunch>(
    `/v1/lms/courses/${seg(courseId)}/preview/steps/${seg(stepId)}/blocks/${seg(blockId)}/h5p`,
    opts,
  )
}

export const getLmsH5PLaunchQuery = (courseId: string, stepId: string, blockId: string, preview: boolean) =>
  queryOptions({
    queryKey: ["lms", "course", courseId, preview ? "preview" : "steps", stepId, "h5p", blockId] as const,
    queryFn: ({ signal }) =>
      (preview ? getLmsPreviewH5PLaunch : getLmsH5PLaunch)(courseId, stepId, blockId, { signal }),
  })

/** POST /v1/lms/steps/{step_id}/blocks/{block_id}/h5p-result — enrolled; an xAPI statement of the player. */
export function postLmsH5PResult(
  stepId: string,
  blockId: string,
  statement: XapiStatement,
  opts?: RequestOptions,
): Promise<BlockResult> {
  return api.post<BlockResult>(`/v1/lms/steps/${seg(stepId)}/blocks/${seg(blockId)}/h5p-result`, { statement }, opts)
}

/** POST /v1/lms/steps/{step_id}/blocks/{block_id}/interactions/{id}/answer — enrolled; only the first answer counts. */
export function postLmsInteractionAnswer(
  stepId: string,
  blockId: string,
  interactionId: string,
  optionIds: string[],
  opts?: RequestOptions,
): Promise<InteractionResult> {
  return api.post<InteractionResult>(
    `/v1/lms/steps/${seg(stepId)}/blocks/${seg(blockId)}/interactions/${seg(interactionId)}/answer`,
    { option_ids: optionIds },
    opts,
  )
}
