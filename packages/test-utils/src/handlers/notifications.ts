import { HttpResponse, http } from "msw"
import { isAnnouncement, notificationItems } from "../fixtures/notifications"
import { apiUrl, noContent, paginate, query } from "./utils"

export const notificationsHandlers = [
  http.get(apiUrl("/v1/notifications"), ({ request }) => {
    const filter = query(request).get("filter") ?? "all"
    const items = notificationItems.filter((item) =>
      filter === "announcements" ? isAnnouncement(item) : filter === "activity" ? !isAnnouncement(item) : true,
    )
    return HttpResponse.json(paginate(items, request))
  }),
  http.get(apiUrl("/v1/notifications/unread-count"), () =>
    HttpResponse.json({ count: notificationItems.filter((item) => item.read_at === null).length }),
  ),
  http.post(apiUrl("/v1/notifications/read-all"), () => noContent()),
  http.post(apiUrl("/v1/notifications/:id/read"), () => noContent()),
]
