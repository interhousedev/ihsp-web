import { HttpResponse, http } from "msw"
import { appMapItems } from "../fixtures/app-map"
import { apiUrl } from "./utils"

/** The app map (`GET /v1/app-map`): a few pages of the student app, one of the LMS and one bot command. */
export const appMapHandlers = [http.get(apiUrl("/v1/app-map"), () => HttpResponse.json({ items: appMapItems }))]
