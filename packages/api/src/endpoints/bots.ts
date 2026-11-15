// Telegram bots registry (role: admin). Backend contract: /v1/admin/bots.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  Bot,
  BotAnnouncementCreate,
  BotAnnouncementResult,
  BotCreate,
  BotPatch,
  BotsResponse,
  BotTokenRotate,
} from "../types/bots"

/** GET /v1/admin/bots — admin; the default bot first. */
export function getAdminBots(opts?: RequestOptions): Promise<BotsResponse> {
  return api.get<BotsResponse>("/v1/admin/bots", opts)
}
export const getAdminBotsQuery = () =>
  queryOptions({
    queryKey: keys.admin.bots.list(),
    queryFn: ({ signal }) => getAdminBots({ signal }),
  })

/** POST /v1/admin/bots — admin; 201. The token is checked with getMe; 422 `admin/bot-token-invalid`, 409 `admin/bot-exists`. */
export function postAdminBot(body: BotCreate, opts?: RequestOptions): Promise<Bot> {
  return api.post<Bot>("/v1/admin/bots", body, opts)
}

/** PATCH /v1/admin/bots/{id} — admin with a step-up code (403 `identity/step-up-invalid`); 409 `admin/bot-default-locked` when turning the default bot off. */
export function patchAdminBot(id: string, body: BotPatch, opts?: RequestOptions): Promise<Bot> {
  return api.patch<Bot>(`/v1/admin/bots/${seg(id)}`, body, opts)
}

/** POST /v1/admin/bots/{id}/rotate-token — admin; 422 `admin/bot-token-mismatch` for another bot's token, 409 `admin/bot-default-token-env` for the default bot. */
export function postAdminBotRotateToken(id: string, body: BotTokenRotate, opts?: RequestOptions): Promise<Bot> {
  return api.post<Bot>(`/v1/admin/bots/${seg(id)}/rotate-token`, body, opts)
}

/** POST /v1/admin/bots/announcements — admin; sends a draft broadcast through the selected bots. */
export function postAdminBotAnnouncement(
  body: BotAnnouncementCreate,
  opts?: RequestOptions,
): Promise<BotAnnouncementResult> {
  return api.post<BotAnnouncementResult>("/v1/admin/bots/announcements", body, opts)
}
