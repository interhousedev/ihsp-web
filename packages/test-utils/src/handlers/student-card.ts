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
  http.get(
    apiUrl("/v1/me/student-card/wallet/apple"),
    () =>
      new HttpResponse(new Uint8Array([80, 75, 3, 4]), {
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": 'attachment; filename="student-card.pkpass"',
        },
      }),
  ),
  http.post(apiUrl("/v1/me/student-card/wallet/google"), () =>
    HttpResponse.json({ url: "https://pay.google.com/gp/v/save/test-jwt" }),
  ),
]
