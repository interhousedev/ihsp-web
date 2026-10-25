// TODO(contract): mirrors the hand-written H5P / interactive video endpoints of @ihsp/api (lms-interactive).
import type { H5PPackage, InteractionResult, XapiStatement } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, param, problem, readJson } from "./utils"

/** The package every upload returns; a file named `bad.h5p` is refused like a zip without `h5p.json`. */
export const h5pPackageFixture: H5PPackage = {
  package_id: "0190a000-0000-4000-8000-0000000000a5",
  title: "Fractions quiz",
  main_library: "H5P.QuestionSet",
  files: 42,
  byte_size: 123456,
}

export const lmsInteractiveHandlers = [
  http.post(apiUrl("/v1/lms/courses/:courseId/h5p"), async ({ request }) => {
    const form = await request.formData()
    const file = form.get("file")
    if (file instanceof File && file.name === "bad.h5p") {
      return problem(422, "lms/h5p-invalid", "This file is not a valid H5P package.")
    }
    return HttpResponse.json(h5pPackageFixture)
  }),
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/h5p"), ({ params }) =>
    HttpResponse.json({ base_url: `/v1/lms/h5p/token-${param(params, "blockId")}/`, expires_in: 14400 }),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/preview/steps/:stepId/blocks/:blockId/h5p"), ({ params }) =>
    HttpResponse.json({ base_url: `/v1/lms/h5p/draft-${param(params, "blockId")}/`, expires_in: 14400 }),
  ),
  http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/h5p-result"), async ({ request }) => {
    const { statement } = await readJson<{ statement: XapiStatement }>(request)
    const score = statement?.result?.score
    return HttpResponse.json({
      score: score?.raw ?? 0,
      max_score: score?.max ?? 0,
      completed: Boolean(statement?.result?.completion),
    })
  }),
  // Option `a` is the right one of every question.
  http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/interactions/:interactionId/answer"), async ({ request }) => {
    const optionIds = (await readJson<{ option_ids: string[] }>(request)).option_ids ?? []
    const correct = optionIds.length === 1 && optionIds[0] === "a"
    const result: InteractionResult = {
      answer: { option_ids: optionIds, correct },
      correct_option_ids: ["a"],
      result: { score: correct ? 1 : 0, max_score: 1, completed: true },
    }
    return HttpResponse.json(result)
  }),
]
