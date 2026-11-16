// AI prompts editor (admin) and the admission pickup location.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AdmissionPickupBody,
  AdmissionPickupSettings,
  PromptAnalyticsParams,
  PromptAnalyticsResponse,
  PromptBody,
  PromptDetail,
  PromptDetailParams,
  PromptRef,
  PromptSlotsResponse,
  PromptVersion,
} from "../types/admin-prompts"

const slotPath = ({ task, name }: PromptRef) => `/v1/admin/ai/prompts/${seg(task)}/${seg(name)}`

/** GET /v1/admin/ai/prompts — admin; every editable slot with its active overrides. */
export function getAdminPrompts(opts?: RequestOptions): Promise<PromptSlotsResponse> {
  return api.get<PromptSlotsResponse>("/v1/admin/ai/prompts", opts)
}
export const getAdminPromptsQuery = () =>
  queryOptions({ queryKey: keys.admin.prompts.list(), queryFn: ({ signal }) => getAdminPrompts({ signal }) })

/** GET /v1/admin/ai/prompts/{task}/{name} — admin; the text in force, the built-in text and the history. */
export function getAdminPrompt(params: PromptDetailParams, opts?: RequestOptions): Promise<PromptDetail> {
  const { locale, ...ref } = params
  return api.get<PromptDetail>(slotPath(ref), { ...opts, query: locale === undefined ? undefined : { locale } })
}
export const getAdminPromptQuery = (params: PromptDetailParams) =>
  queryOptions({
    queryKey: keys.admin.prompts.detail(params),
    queryFn: ({ signal }) => getAdminPrompt(params, { signal }),
  })

/** PUT /v1/admin/ai/prompts/{task}/{name} — admin; stores a new active version. */
export function putAdminPrompt(ref: PromptRef, body: PromptBody, opts?: RequestOptions): Promise<PromptVersion> {
  return api.put<PromptVersion>(slotPath(ref), body, opts)
}

/** DELETE /v1/admin/ai/prompts/{task}/{name} — admin; reverts a locale to the built-in text. */
export function revertAdminPrompt(params: PromptDetailParams, opts?: RequestOptions): Promise<void> {
  const { locale, ...ref } = params
  return api.delete<void>(slotPath(ref), { ...opts, query: locale === undefined ? undefined : { locale } })
}

/** POST /v1/admin/ai/prompts/{task}/{name}/versions/{version}/activate — admin. */
export function activateAdminPrompt(
  ref: PromptRef & { version: number },
  opts?: RequestOptions,
): Promise<PromptVersion> {
  return api.post<PromptVersion>(
    `/v1/admin/ai/prompts/${seg(ref.task)}/${seg(ref.name)}/versions/${ref.version}/activate`,
    undefined,
    opts,
  )
}

/** GET /v1/admin/ai/prompts/analytics — admin; calls, tokens, cost and errors per task and version. */
export function getAdminPromptAnalytics(
  params?: PromptAnalyticsParams,
  opts?: RequestOptions,
): Promise<PromptAnalyticsResponse> {
  return api.get<PromptAnalyticsResponse>("/v1/admin/ai/prompts/analytics", { ...opts, query: params })
}
export const getAdminPromptAnalyticsQuery = (params?: PromptAnalyticsParams) =>
  queryOptions({
    queryKey: keys.admin.prompts.analytics(params),
    queryFn: ({ signal }) => getAdminPromptAnalytics(params, { signal }),
  })

/** GET /v1/admission/officer/settings — the pickup location per locale. */
export function getAdmissionPickup(opts?: RequestOptions): Promise<AdmissionPickupSettings> {
  return api.get<AdmissionPickupSettings>("/v1/admission/officer/settings", opts)
}
export const getAdmissionPickupQuery = () =>
  queryOptions({ queryKey: keys.admin.admissionPickup(), queryFn: ({ signal }) => getAdmissionPickup({ signal }) })

/** PUT /v1/admission/officer/settings — sets the pickup location per locale. */
export function putAdmissionPickup(body: AdmissionPickupBody, opts?: RequestOptions): Promise<AdmissionPickupSettings> {
  return api.put<AdmissionPickupSettings>("/v1/admission/officer/settings", body, opts)
}
