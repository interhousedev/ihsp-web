import { HttpResponse, http } from "msw"
import { honoursBlocked } from "../fixtures/honours"
import { apiUrl } from "./utils"

export const honoursHandlers = [
  http.get(apiUrl("/v1/me/honours"), () => HttpResponse.json(honoursBlocked)),
  http.get(apiUrl("/v1/me/emis/rating-book"), () => HttpResponse.json({ url: "https://emis.example/rating-book.pdf" })),
]
