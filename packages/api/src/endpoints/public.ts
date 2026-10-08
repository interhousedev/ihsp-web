// Public (anonymous) endpoints: shared chats and flash card sets, abuse reports, short links, room pages.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type { PublicShare, ReportBody, RoomPageParams } from "../types/public"

/** GET /v1/public/shares/{slug} — none; `404` unknown slug, `410` removed. */
export function getPublicShare(slug: string, opts?: RequestOptions): Promise<PublicShare> {
  return api.get<PublicShare>(`/v1/public/shares/${seg(slug)}`, { ...opts, auth: "none" })
}
export const getPublicShareQuery = (slug: string) =>
  queryOptions({
    queryKey: keys.public.share(slug),
    queryFn: ({ signal }) => getPublicShare(slug, { signal }),
  })

/** POST /v1/public/reports — none, rate limited; `202`. */
export function postPublicReports(body: ReportBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/public/reports", body, { ...opts, auth: "none" })
}

/**
 * GET /s/{slug} (dev) — short link; the response is `302`, interstitial HTML, `404` or `410` (fetch follows redirects).
 * In production the host is `s.ihsu.uz`: pass `baseUrl: getConfig().SHORT_LINKS_URL`.
 * The web normally navigates to short links instead of fetching them.
 */
export function getShortLink(slug: string, opts?: RequestOptions & { baseUrl?: string }): Promise<string> {
  return api.get<string>(`/s/${seg(slug)}`, { ...opts, auth: "none", responseType: "text" })
}

/**
 * GET /r/{room_slug}?pin=&date= (dev) — room page HTML (a PIN form without a valid PIN).
 * In production the host is `ihsu.uz`: pass `baseUrl: getConfig().ROOMS_URL`.
 */
export function getRoomPage(
  roomSlug: string,
  params?: RoomPageParams,
  opts?: RequestOptions & { baseUrl?: string },
): Promise<string> {
  return api.get<string>(`/r/${seg(roomSlug)}`, {
    ...opts,
    auth: "none",
    query: params,
    responseType: "text",
  })
}

// --- Names used by the app plans ---

export const postReport = postPublicReports
