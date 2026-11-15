// Telegram bots registry (admin). Backend contract: /v1/admin/bots.

export type BotFeatureName = "ai_agent" | "open_ai_agent" | "commands" | "notifications" | "announcements" | "mini_app"

export type BotFeatures = Record<BotFeatureName, boolean>

export type Bot = {
  id: string
  name: string
  username: string
  enabled: boolean
  /** The bot of the env token; cannot be turned off and sends personal notifications. */
  is_default: boolean
  features: BotFeatures
  /** "…" and the last 4 characters of the token; the token itself never leaves the server. */
  token_mask: string
  /** Linked users who have written to this bot. */
  members: number
  created_at: string
  updated_at: string
}

export type BotsResponse = { items: Bot[] }
/** `otp_code` is a step-up code (POST /v1/id/me/step-up) required by every bot write; a wrong one is 403 `identity/step-up-invalid`. */
export type BotCreate = { name: string; token: string; otp_code: string }
export type BotPatch = { name?: string; enabled?: boolean; features?: Partial<BotFeatures>; otp_code: string }
export type BotTokenRotate = { token: string; otp_code: string }
export type BotAnnouncementCreate = { broadcast_id: string; bot_ids: string[]; otp_code: string }
export type BotAnnouncementResult = { broadcast_id: string; recipients: number; per_bot: Record<string, number> }
