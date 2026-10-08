import { HttpResponse, http } from "msw"
import { publicShareGoneSlug, publicShares, roomPageHtml, shortLinkHtml } from "../fixtures/public"
import { accepted, apiUrl, param, problem } from "./utils"

function html(body: string): Response {
  return new HttpResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}

export const publicHandlers = [
  // `kq7x2m9a` is a shared chat, `zr5t8w1c` a shared flash card set, `gone0000` was removed (`410`); other slugs are `404`.
  http.get(apiUrl("/v1/public/shares/:slug"), ({ params }) => {
    const slug = param(params, "slug")
    if (slug === publicShareGoneSlug) return problem(410, "common/gone", "This link was removed")
    const share = publicShares[slug]
    return share ? HttpResponse.json(share) : problem(404, "common/not-found", "Link not found")
  }),
  http.post(apiUrl("/v1/public/reports"), () => accepted()),
  http.get(apiUrl("/s/:slug"), () => html(shortLinkHtml)),
  http.get(apiUrl("/r/:roomSlug"), () => html(roomPageHtml)),
]
