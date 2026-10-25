// Academic — work-off templates of the teacher and the work-offs of a lesson's absences.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { WorkOffItem, WorkOffPatchBody, WorkOffTemplate, WorkOffTemplateBody } from "../types/work-offs-staff"

/** GET /v1/staff/work-off-templates — teacher or admin; the caller's own templates, oldest first. */
export function getWorkOffTemplates(opts?: RequestOptions): Promise<WorkOffTemplate[]> {
  return api.get<WorkOffTemplate[]>("/v1/staff/work-off-templates", opts)
}
export const getWorkOffTemplatesQuery = () =>
  queryOptions({
    queryKey: keys.staff.workOffTemplates(),
    queryFn: ({ signal }) => getWorkOffTemplates({ signal }),
  })

/** POST /v1/staff/work-off-templates — `422` after 20 templates; `is_default` clears the other default. */
export function postWorkOffTemplate(body: WorkOffTemplateBody, opts?: RequestOptions): Promise<WorkOffTemplate> {
  return api.post<WorkOffTemplate>("/v1/staff/work-off-templates", body, opts)
}

/** PUT /v1/staff/work-off-templates/{id} — own template, else `404`. */
export function putWorkOffTemplate(
  id: string,
  body: WorkOffTemplateBody,
  opts?: RequestOptions,
): Promise<WorkOffTemplate> {
  return api.put<WorkOffTemplate>(`/v1/staff/work-off-templates/${seg(id)}`, body, opts)
}

/** DELETE /v1/staff/work-off-templates/{id} — own template, else `404`; work-offs keep their text. */
export function deleteWorkOffTemplate(id: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`/v1/staff/work-off-templates/${seg(id)}`, opts)
}

/** PATCH /v1/staff/work-offs/{id} — lesson teacher or admin; `status` done sets `done_at`, assigned clears it. */
export function patchWorkOff(id: string, body: WorkOffPatchBody, opts?: RequestOptions): Promise<WorkOffItem> {
  return api.patch<WorkOffItem>(`/v1/staff/work-offs/${seg(id)}`, body, opts)
}

/** DELETE /v1/staff/work-offs/{id} — lesson teacher or admin. */
export function deleteWorkOff(id: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`/v1/staff/work-offs/${seg(id)}`, opts)
}
