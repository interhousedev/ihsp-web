import type { Bot, BotAnnouncementCreate, BotCreate, BotPatch, BotTokenRotate } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { botList } from "../fixtures/bots"
import { apiUrl, notFound, param, problem, readJson } from "./utils"

function findBot(id: string): Bot | undefined {
  return botList.find((bot) => bot.id === id)
}

const STEP_UP_CODE = "123456"
const stepUpInvalid = () => problem(403, "identity/step-up-invalid", "The confirmation code is wrong")

/** Telegram bots registry (`/v1/admin/bots*`). `announcements` is declared before `:id`. Every write needs `otp_code` "123456". */
export const botsHandlers = [
  http.get(apiUrl("/v1/admin/bots"), () => HttpResponse.json({ items: botList })),
  http.post(apiUrl("/v1/admin/bots/announcements"), async ({ request }) => {
    const body = await readJson<BotAnnouncementCreate>(request)
    if (body.otp_code !== STEP_UP_CODE) return stepUpInvalid()
    const bots = (body.bot_ids ?? []).map((id) => findBot(id))
    if (bots.some((bot) => !bot)) return notFound("Bot")
    if (bots.some((bot) => !bot?.features.announcements))
      return problem(422, "admin/bot-announcements-off", "Announcements are off for a selected bot")
    const perBot = Object.fromEntries(bots.map((bot) => [bot?.id ?? "", bot?.members ?? 0]))
    const recipients = Object.values(perBot).reduce((sum, count) => sum + count, 0)
    return HttpResponse.json({ broadcast_id: body.broadcast_id, recipients, per_bot: perBot })
  }),
  http.post(apiUrl("/v1/admin/bots"), async ({ request }) => {
    const body = await readJson<BotCreate>(request)
    if (body.otp_code !== STEP_UP_CODE) return stepUpInvalid()
    if (!body.token || body.token.length < 20)
      return problem(422, "admin/bot-token-invalid", "Telegram rejected the token")
    const created: Bot = {
      id: "bot-new",
      name: body.name ?? "",
      username: "new_test_bot",
      enabled: true,
      is_default: false,
      features: {
        ai_agent: false,
        open_ai_agent: false,
        commands: false,
        notifications: false,
        announcements: false,
        mini_app: false,
      },
      token_mask: `…${body.token.slice(-4)}`,
      members: 0,
      created_at: "2026-03-01T08:00:00Z",
      updated_at: "2026-03-01T08:00:00Z",
    }
    return HttpResponse.json(created, { status: 201 })
  }),
  http.post(apiUrl("/v1/admin/bots/:id/rotate-token"), async ({ request, params }) => {
    const bot = findBot(param(params, "id"))
    if (!bot) return notFound("Bot")
    if (bot.is_default)
      return problem(409, "admin/bot-default-token-env", "The default bot token is set in the server environment")
    const body = await readJson<BotTokenRotate>(request)
    if (body.otp_code !== STEP_UP_CODE) return stepUpInvalid()
    return HttpResponse.json({ ...bot, token_mask: `…${(body.token ?? "").slice(-4)}` })
  }),
  http.patch(apiUrl("/v1/admin/bots/:id"), async ({ request, params }) => {
    const body = await readJson<BotPatch>(request)
    if (body.otp_code !== STEP_UP_CODE) return stepUpInvalid()
    const bot = findBot(param(params, "id"))
    if (!bot) return notFound("Bot")
    if (bot.is_default && body.enabled === false)
      return problem(409, "admin/bot-default-locked", "The default bot cannot be disabled")
    return HttpResponse.json({
      ...bot,
      name: body.name ?? bot.name,
      enabled: body.enabled ?? bot.enabled,
      features: { ...bot.features, ...body.features },
    })
  }),
]
