import { HttpResponse, http } from "msw"
import { myWorkOffs } from "../fixtures/work-offs-me"
import { apiUrl, query } from "./utils"

/** `GET /v1/me/work-offs`: open ones by default (`status=all` adds the done ones), newest lesson first. */
export const workOffsMeHandlers = [
  http.get(apiUrl("/v1/me/work-offs"), ({ request }) => {
    const all = query(request).get("status") === "all"
    const items = myWorkOffs.filter((item) => all || item.status === "assigned")
    return HttpResponse.json(items.toSorted((a, b) => b.date.localeCompare(a.date)))
  }),
]
