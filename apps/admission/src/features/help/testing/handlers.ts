import { apiUrl } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"

/** The queries made to the helper search, for assertions on the minimum length. */
export const helperQueries: string[] = []

export function helpHandlers() {
  return [
    http.get(apiUrl("/v1/admission/help/helpers"), ({ request }) => {
      helperQueries.push(new URL(request.url).searchParams.get("q") ?? "")
      return HttpResponse.json({ items: [{ user_id: "u1", display_name: "Madina Yusupova", role: "teacher" }] })
    }),
  ]
}
