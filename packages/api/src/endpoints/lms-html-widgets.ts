// LMS — author-uploaded HTML widgets (the `html` block).

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

/** The upload limit of the backend (`WIDGET_MAX_UPLOAD_BYTES`). */
export const HTML_WIDGET_MAX_BYTES = 20 * 1024 * 1024

export type HtmlWidgetFile = { path: string; byte_size: number; content_type: string }

/** An uploaded widget: its id and its files (sorted by path). */
export type HtmlWidgetPackage = {
  package_id: string
  files: HtmlWidgetFile[]
  file_count: number
  byte_size: number
}

/** A signed, short-lived URL of a widget: `entry_url` is `base_url` + `index.html`. */
export type HtmlWidgetLaunch = { base_url: string; entry_url: string; expires_in: number }

/** The path of `POST /v1/lms/courses/{id}/html-widgets` (multipart field `file`; the editor uploads it with XHR to
 * show progress). */
export function lmsHtmlWidgetUploadPath(courseId: string): string {
  return `/v1/lms/courses/${seg(courseId)}/html-widgets`
}

/** POST /v1/lms/courses/{id}/html-widgets — course `edit`; one `.html` file or a `.zip` with `index.html` at its root. */
export function postLmsHtmlWidget(courseId: string, file: File, opts?: RequestOptions): Promise<HtmlWidgetPackage> {
  const form = new FormData()
  form.append("file", file)
  return api.request<HtmlWidgetPackage>({
    ...opts,
    method: "POST",
    path: lmsHtmlWidgetUploadPath(courseId),
    formData: form,
  })
}

/** GET /v1/lms/courses/{id}/steps/{step_id}/blocks/{block_id}/html-widget — enrolled or staff. */
export function getLmsHtmlWidgetLaunch(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<HtmlWidgetLaunch> {
  return api.get<HtmlWidgetLaunch>(
    `/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}/blocks/${seg(blockId)}/html-widget`,
    opts,
  )
}

/** GET /v1/lms/courses/{id}/preview/steps/{step_id}/blocks/{block_id}/html-widget — `view_drafts`; a draft's widget. */
export function getLmsPreviewHtmlWidgetLaunch(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<HtmlWidgetLaunch> {
  return api.get<HtmlWidgetLaunch>(
    `/v1/lms/courses/${seg(courseId)}/preview/steps/${seg(stepId)}/blocks/${seg(blockId)}/html-widget`,
    opts,
  )
}

export const getLmsHtmlWidgetLaunchQuery = (
  courseId: string,
  stepId: string,
  blockId: string,
  preview: boolean,
  packageId: string,
) =>
  queryOptions({
    queryKey: [
      "lms",
      "course",
      courseId,
      preview ? "preview" : "steps",
      stepId,
      "html-widget",
      blockId,
      packageId,
    ] as const,
    queryFn: ({ signal }) =>
      (preview ? getLmsPreviewHtmlWidgetLaunch : getLmsHtmlWidgetLaunch)(courseId, stepId, blockId, { signal }),
  })
