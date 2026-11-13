import { HttpResponse, http } from "msw"
import { studentCard, studentCardToken } from "../fixtures/student-card"
import { apiUrl } from "./utils"

let issued = 0

/** Forget the tokens issued so far (the next one is number 1 again). */
export function resetStudentCardTokens(): void {
  issued = 0
}

export const studentCardHandlers = [
  http.get(apiUrl("/v1/me/student-card"), () => HttpResponse.json(studentCard())),
  http.post(apiUrl("/v1/me/student-card/tokens"), () => HttpResponse.json(studentCardToken(++issued))),
]
