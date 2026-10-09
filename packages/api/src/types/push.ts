// Web Push (backend/app/interfaces/http/v1/push): the key to subscribe with and the caller's device subscriptions.

/** `GET /v1/push/config`: `enabled` is false (and the key null) while the server has no VAPID keys. */
export type PushConfig = {
  enabled: boolean
  vapid_public_key: string | null
}

/** Body of `POST /v1/me/push-subscriptions`: `PushSubscription.toJSON()` plus the browser's user agent. */
export type PushSubscriptionBody = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user_agent?: string | null
}

export type PushSubscriptionCreated = { id: string }

/** Body of `DELETE /v1/me/push-subscriptions`. */
export type PushUnsubscribeBody = { endpoint: string }
