import { HttpResponse, http } from "msw"
import {
  publicStudentCard,
  publicStudentCardNoPhotoToken,
  publicStudentCardToken,
} from "../fixtures/public-student-cards"
import { apiUrl, param, problem } from "./utils"

const PNG_1X1 = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
)

export const publicStudentCardHandlers = [
  http.get(apiUrl("/v1/public/student-cards/:token"), ({ params }) => {
    const token = param(params, "token")
    if (token === publicStudentCardToken) return HttpResponse.json(publicStudentCard())
    if (token === publicStudentCardNoPhotoToken) return HttpResponse.json(publicStudentCard({ has_photo: false }))
    return problem(404, "common/not-found", "Card not found")
  }),
  http.get(apiUrl("/v1/public/student-cards/:token/photo"), ({ params }) =>
    param(params, "token") === publicStudentCardToken
      ? new HttpResponse(PNG_1X1, { headers: { "Content-Type": "image/png" } })
      : problem(404, "common/not-found", "Card not found"),
  ),
]
