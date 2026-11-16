import { api } from "@ihsp/api"

export type GuestActivity = {
  position: string
  org: string
  description: string
  kind: string
}

export type GuestResponse = { id: string; text: string; url: string | null; created_at: string }

export type GuestView = {
  first_name: string | null
  kind: string
  brief: string
  status: string
  scope: string[]
  expires_at: string
  activities: GuestActivity[]
  responses: GuestResponse[]
}

/** The prefixes of the two guest tokens: `gst_` is the link secret, `gss_` the short session it is exchanged for. */
export const LINK_TOKEN_PREFIX = "gst_"

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Exchanges the link token for a session token. The link token travels only in the header. */
export async function exchangeGuestToken(
  linkToken: string,
  signal?: AbortSignal,
): Promise<{ token: string; expires_at: string }> {
  return api.request({
    method: "POST",
    path: "/v1/public/admission/guest/session",
    auth: "none",
    headers: bearer(linkToken),
    signal,
  })
}

export async function fetchGuestView(sessionToken: string, signal?: AbortSignal): Promise<GuestView> {
  return api.request({
    method: "GET",
    path: "/v1/public/admission/guest",
    auth: "none",
    headers: bearer(sessionToken),
    signal,
  })
}

export async function sendGuestResponse(
  sessionToken: string,
  body: { text: string; url: string | null },
): Promise<GuestResponse> {
  return api.request({
    method: "POST",
    path: "/v1/public/admission/guest/respond",
    auth: "none",
    headers: bearer(sessionToken),
    body,
  })
}
