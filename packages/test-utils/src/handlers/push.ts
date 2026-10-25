import type { PushSubscriptionBody, PushUnsubscribeBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { pushConfig } from "../fixtures/push"
import { apiUrl, noContent, nextId, readJson } from "./utils"

/** Endpoints the test server holds, so a test can see what the app subscribed and unsubscribed. */
export const pushSubscriptions = new Map<string, string>()

export function resetPushSubscriptions(): void {
  pushSubscriptions.clear()
}

export const pushHandlers = [
  http.get(apiUrl("/v1/push/config"), () => HttpResponse.json(pushConfig)),
  http.post(apiUrl("/v1/me/push-subscriptions"), async ({ request }) => {
    const body = await readJson<PushSubscriptionBody>(request)
    const id = pushSubscriptions.get(body.endpoint ?? "") ?? nextId(0x70)
    pushSubscriptions.set(body.endpoint ?? "", id)
    return HttpResponse.json({ id }, { status: 201 })
  }),
  http.delete(apiUrl("/v1/me/push-subscriptions"), async ({ request }) => {
    const body = await readJson<PushUnsubscribeBody>(request)
    pushSubscriptions.delete(body.endpoint ?? "")
    return noContent()
  }),
]
