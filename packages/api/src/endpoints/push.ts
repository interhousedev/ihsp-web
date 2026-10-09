// Web Push subscriptions of the logged-in user's devices.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type { PushConfig, PushSubscriptionBody, PushSubscriptionCreated, PushUnsubscribeBody } from "../types/push"

/** GET /v1/push/config — bearer. */
export function getPushConfig(opts?: RequestOptions): Promise<PushConfig> {
  return api.get<PushConfig>("/v1/push/config", opts)
}
export const getPushConfigQuery = () =>
  queryOptions({
    queryKey: keys.push.config(),
    queryFn: ({ signal }) => getPushConfig({ signal }),
  })

/** POST /v1/me/push-subscriptions — bearer; `201 {id}`. The same endpoint sent again updates the row (and moves it to the caller). */
export function postPushSubscription(
  body: PushSubscriptionBody,
  opts?: RequestOptions,
): Promise<PushSubscriptionCreated> {
  return api.post<PushSubscriptionCreated>("/v1/me/push-subscriptions", body, opts)
}

/** DELETE /v1/me/push-subscriptions — bearer; `204`. Deleting an unknown endpoint is not an error. */
export function deletePushSubscription(body: PushUnsubscribeBody, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>("/v1/me/push-subscriptions", { ...opts, body })
}
