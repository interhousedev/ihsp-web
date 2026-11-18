import type { AdmissionPickupBody, PromptVersion } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, param, readJson } from "./utils"

const version = (number: number): PromptVersion => ({
  id: "00000000-0000-4000-8000-000000000001",
  version: number,
  locale: "",
  text: "Prompt text",
  hash: "hash",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  created_by: null,
  note: "",
})

let pickup: Record<string, string> = { uz: "Kabinet 12", ru: "Кабинет 12", en: "Room 12" }

/** AI prompts editor (admin) and the admission officer's pickup location. */
export const adminPromptsHandlers = [
  http.get(apiUrl("/v1/admin/ai/prompts"), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl("/v1/admin/ai/prompts/analytics"), () =>
    HttpResponse.json({ from: "2026-01-01", to: "2026-01-31", items: [] }),
  ),
  http.get(apiUrl("/v1/admin/ai/prompts/analytics/calls"), () => HttpResponse.json({ items: [] })),
  http.post(apiUrl("/v1/admin/ai/prompts/:task/:name/versions/:version/activate"), ({ params }) =>
    HttpResponse.json(version(Number(param(params, "version")))),
  ),
  http.get(apiUrl("/v1/admission/officer/settings"), () => HttpResponse.json({ pickup_location: pickup })),
  http.put(apiUrl("/v1/admission/officer/settings"), async ({ request }) => {
    pickup = (await readJson<AdmissionPickupBody>(request)).pickup_location ?? pickup
    return HttpResponse.json({ pickup_location: pickup })
  }),
]
