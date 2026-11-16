// AI prompts (admin): editable slots, their version history and per-version analytics (`/v1/admin/ai/prompts*`),
// and the admission pickup location (`/v1/admission/officer/settings`).
import type { components } from "../generated/openapi"

type Schemas = components["schemas"]

export type PromptSlot = Schemas["PromptSlotOut"]
export type PromptSlotsResponse = Schemas["PromptSlotsResponse"]
export type PromptDetail = Schemas["PromptDetailOut"]
export type PromptVersion = Schemas["PromptVersionOut"]
export type PromptBody = Schemas["PromptBody"]
export type PromptStats = Schemas["PromptStatsOut"]
export type PromptAnalyticsResponse = Schemas["PromptAnalyticsResponse"]

/** A prompt locale: "" applies to every locale. */
export type PromptLocale = NonNullable<PromptBody["locale"]>

export type PromptRef = { task: string; name: string }
export type PromptDetailParams = PromptRef & { locale?: PromptLocale }
export type PromptAnalyticsParams = { task?: string; from?: string; to?: string }

export type AdmissionPickupSettings = Schemas["OfficerSettingsOut"]
export type AdmissionPickupBody = Schemas["OfficerSettingsIn"]
