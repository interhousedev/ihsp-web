/**
 * Typed client of the public clubs API (no auth, no emails): GET /v1/public/clubs, GET /v1/public/clubs/{slug},
 * POST /v1/public/clubs/{slug}/contact. Shapes follow `openapi.json` (PublicClubOut, PublicClubPageOut, ContactIn).
 */
/** API origin: runtime `window.__ENV__.API_URL` (public/env.js), like the apps; the build-time variable is the fallback. */
function base(): string {
  const w = typeof window === "undefined" ? undefined : (window as unknown as { __ENV__?: { API_URL?: string } }).__ENV__
  return (w?.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
}

export type PublicClubListItem = {
  id: string
  slug: string
  name: string
  description: string
  join_policy: string
  logo_url: string | null
  contact_enabled: boolean
}
export type PublicTeamMember = { name: string; position: string; bio: string; photo_url: string | null }
export type PublicClubPage = PublicClubListItem & { team: PublicTeamMember[] }
export type ContactFounderBody = { name: string; email: string; message: string; captcha_token?: string; website?: string | null }

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}/v1/public/clubs${path}`, init)
  if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status })
  return (res.status === 202 ? undefined : await res.json()) as T
}

export const publicClubsApi = {
  list: () => call<{ items: PublicClubListItem[]; captcha_site_key: string }>(""),
  get: (slug: string) => call<PublicClubPage>(`/${encodeURIComponent(slug)}`),
  contact: (slug: string, body: ContactFounderBody) =>
    call<void>(`/${encodeURIComponent(slug)}/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
}

/** Stable accent hue for a club without a logo. */
export function hueOf(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
  return h
}
