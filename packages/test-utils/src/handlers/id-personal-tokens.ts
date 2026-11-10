import type { PersonalToken, PersonalTokenCreateBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, nextId, noContent, notFound, readJson } from "./utils"

/** The secret a new personal token shows once. */
export const personalTokenSecret = "ihsp_pat_3kQ9vXw2LmN7rT5yBcD8fGhJ4pZaE6uS"

function seed(): PersonalToken[] {
  return [
    {
      id: "0198f0a0-0000-7000-8000-0000000000a1",
      name: "Grades script",
      prefix: "ihsp_pat_Ab12",
      scopes: ["me:read"],
      created_at: "2026-09-01T08:00:00Z",
      expires_at: "2026-12-01T08:00:00Z",
      last_used_at: "2026-10-05T10:30:00Z",
      revoked_at: null,
    },
  ]
}

let tokens = seed()

/** Back to the one seeded token (preload calls this after every test). */
export function resetPersonalTokens(): void {
  tokens = seed()
}

/** List, create (the secret comes back once) and revoke personal access tokens. */
export const idPersonalTokensHandlers = [
  http.get(apiUrl("/v1/id/personal-tokens"), () => HttpResponse.json(tokens)),
  http.post(apiUrl("/v1/id/personal-tokens"), async ({ request }) => {
    const body = await readJson<PersonalTokenCreateBody>(request)
    const created: PersonalToken = {
      id: nextId(12),
      name: body.name ?? "",
      prefix: personalTokenSecret.slice(0, 13),
      scopes: body.scopes ?? [],
      created_at: "2026-10-07T05:12:00Z",
      expires_at: new Date(Date.UTC(2026, 9, 7 + (body.expires_in_days ?? 30), 5, 12))
        .toISOString()
        .replace(".000Z", "Z"),
      last_used_at: null,
      revoked_at: null,
    }
    tokens = [created, ...tokens]
    return HttpResponse.json({ personal_token: created, token: personalTokenSecret }, { status: 201 })
  }),
  http.delete(apiUrl("/v1/id/personal-tokens/:id"), ({ params }) => {
    if (!tokens.some((each) => each.id === params.id)) return notFound()
    tokens = tokens.filter((each) => each.id !== params.id)
    return noContent()
  }),
]
