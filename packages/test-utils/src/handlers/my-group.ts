import { HttpResponse, http } from "msw"
import { myGroupForHead } from "../fixtures/my-group"
import { apiUrl } from "./utils"

/** The student's group card, homeroom teacher, head student and members. */
export const myGroupHandlers = [http.get(apiUrl("/v1/me/group"), () => HttpResponse.json(myGroupForHead))]
