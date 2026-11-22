import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

/** `POST /v1/admission/today/programs/seen` answers 204; the seen marker is server state. */
export const todayHandlers = [
  http.post(apiUrl("/v1/admission/today/programs/seen"), () => new HttpResponse(null, { status: 204 })),
]
