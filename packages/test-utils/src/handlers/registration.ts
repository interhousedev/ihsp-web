import type { RegisterCompleteBody, RegisterEmisBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  emisProfile,
  emisRatings,
  emisSubjects,
  reclaimStart,
  registerCompleteResponse,
  registrationStart,
  registrationStartWithImport,
} from "../fixtures/registration"
import { accepted, apiUrl, noContent, problem, query, readJson } from "./utils"

/**
 * Magic EMIS credentials (anything else is accepted):
 * login `imported` returns an imported student that must be confirmed, `linked` is `id/emis-already-linked`,
 * `wrong-institution` is `id/wrong-institution`, `emis-down` is `emis/unavailable`; password `bad-password` is `emis/auth-failed`.
 */
function emisOutcome(body: Partial<RegisterEmisBody>): Response | null {
  if (body.emis_password === "bad-password") return problem(401, "emis/auth-failed", "EMIS rejected the credentials")
  if (body.emis_login === "emis-down") return problem(503, "emis/unavailable", "EMIS is unavailable")
  if (body.emis_login === "linked") {
    return problem(409, "id/emis-already-linked", "This EMIS account is already linked", {
      params: { login: "brastilov.aleksey" },
    })
  }
  if (body.emis_login === "wrong-institution") {
    return problem(403, "id/wrong-institution", "This EMIS account belongs to another institution")
  }
  return null
}

export const registrationHandlers = [
  http.post(apiUrl("/v1/id/register/emis"), async ({ request }) => {
    const body = await readJson<RegisterEmisBody>(request)
    const failure = emisOutcome(body)
    if (failure) return failure
    return HttpResponse.json(body.emis_login === "imported" ? registrationStartWithImport : registrationStart)
  }),
  http.post(apiUrl("/v1/id/register/email"), () => accepted()),
  http.post(apiUrl("/v1/id/register/complete"), async ({ request }) => {
    const body = await readJson<RegisterCompleteBody>(request)
    return HttpResponse.json({
      ...registerCompleteResponse,
      redirect_to: body.login_challenge ? "http://localhost:4444/oauth2/auth?login_verifier=test" : null,
      login_ticket: body.login_challenge ? null : "register-ticket",
    })
  }),
  http.post(apiUrl("/v1/id/reclaim/emis"), async ({ request }) => {
    const failure = emisOutcome(await readJson<RegisterEmisBody>(request))
    return failure ?? HttpResponse.json(reclaimStart)
  }),
  http.post(apiUrl("/v1/id/reclaim/email"), () => accepted()),
  http.post(apiUrl("/v1/id/reclaim/complete"), () => noContent()),

  // Internal EMIS gateway (service token); the user id is accepted as is.
  http.get(apiUrl("/internal/emis/:userId/profile"), () => HttpResponse.json(emisProfile)),
  http.get(apiUrl("/internal/emis/:userId/subjects"), () => HttpResponse.json(emisSubjects)),
  http.get(apiUrl("/internal/emis/:userId/ratings"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json({
      ...emisRatings,
      emis_subject_id: Number(search.get("subject") ?? emisRatings.emis_subject_id),
      semester: Number(search.get("semester") ?? emisRatings.semester),
    })
  }),
]
