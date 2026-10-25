import type { OauthTelegramBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { logoutResponse, refreshedTokenResponse, tokenResponse } from "../fixtures/oauth"
import { apiUrl, problem, readJson } from "./utils"

export const oauthHandlers = [
  http.post(apiUrl("/v1/oauth/token"), () => HttpResponse.json(tokenResponse)),
  http.post(apiUrl("/v1/oauth/refresh"), () => HttpResponse.json(refreshedTokenResponse)),
  http.post(apiUrl("/v1/oauth/logout"), () => HttpResponse.json(logoutResponse)),
  // `init_data: "invalid"` is rejected, so a mini app falls back to the "log in in the bot" screen.
  http.post(apiUrl("/v1/oauth/telegram"), async ({ request }) => {
    const body = await readJson<OauthTelegramBody>(request)
    if (body.init_data === "invalid") {
      return problem(401, "auth/unauthorized", "Telegram account is not linked")
    }
    return HttpResponse.json(tokenResponse)
  }),
  http.post(apiUrl("/v1/oauth/token-hook"), () =>
    HttpResponse.json({ session: { access_token: { roles: ["student"] }, id_token: {} } }),
  ),
]
