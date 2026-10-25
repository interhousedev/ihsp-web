import type {
  AdminFeedbackDetail,
  AdminFeedbackListItem,
  AdminFeedbackResponse,
  AdminFeedbackResponseInput,
  AdminFeedbackStatusPatch,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, notFound, paginate, param, query, readJson } from "./utils"

/** The "Call for improvements" queue as the mocked backend serves it (stateless: writes are echoed, not stored). */
export const adminFeedbackFixtures: AdminFeedbackDetail[] = [
  {
    id: "7b1c0000-0000-4000-8000-000000000101",
    kind: "bug",
    area: "my",
    title: "Расписание не открывается",
    description: "На телефоне страница расписания пустая.",
    status: "new",
    source: "web",
    created_at: "2026-10-20T09:15:00+05:00",
    attachments: [
      {
        file_id: "f0000000-0000-4000-8000-000000000101",
        name: "screen.png",
        mime: "image/png",
        size: 2048,
        download_url: "https://storage.ihsu.test/feedback/f0000000-0000-4000-8000-000000000101?sig=test",
      },
    ],
    response_count: 0,
    reporter: { user_id: "u-1", display_name: "Иванов Иван", roles: ["student"], group_name: "10-A" },
    page_url: "https://my.ihsu.uz/timetable/",
    responses: [],
  },
  {
    id: "7b1c0000-0000-4000-8000-000000000102",
    kind: "idea",
    area: "notebooks",
    title: "Экспорт блокнота в PDF",
    description: "Хочется сохранять конспект одним файлом.",
    status: "in_review",
    source: "bot",
    created_at: "2026-10-22T16:40:00+05:00",
    attachments: [],
    response_count: 0,
    reporter: { user_id: "u-2", display_name: "Каримова Зарина", roles: ["student"], group_name: null },
    page_url: null,
    responses: [],
  },
]

function toListItem({
  page_url: _pageUrl,
  responses: _responses,
  ...item
}: AdminFeedbackDetail): AdminFeedbackListItem {
  return item
}

function findFeedback(id: string): AdminFeedbackDetail | undefined {
  return adminFeedbackFixtures.find((item) => item.id === id)
}

export const adminFeedbackHandlers = [
  http.get(apiUrl("/v1/admin/feedback"), ({ request }) => {
    const search = query(request)
    const status = search.get("status")
    const kind = search.get("kind")
    const area = search.get("area")
    const items = adminFeedbackFixtures
      .map(toListItem)
      .filter(
        (item) => (!status || item.status === status) && (!kind || item.kind === kind) && (!area || item.area === area),
      )
    return HttpResponse.json(paginate(items, request))
  }),
  http.get(apiUrl("/v1/admin/feedback/:id"), ({ params }) => {
    const found = findFeedback(param(params, "id"))
    return found ? HttpResponse.json(found) : notFound("Feedback")
  }),
  http.patch(apiUrl("/v1/admin/feedback/:id"), async ({ params, request }) => {
    const found = findFeedback(param(params, "id"))
    if (!found) return notFound("Feedback")
    const body = await readJson<AdminFeedbackStatusPatch>(request)
    return HttpResponse.json({ ...found, status: body.status ?? found.status })
  }),
  http.post(apiUrl("/v1/admin/feedback/:id/responses"), async ({ params, request }) => {
    const found = findFeedback(param(params, "id"))
    if (!found) return notFound("Feedback")
    const body = await readJson<AdminFeedbackResponseInput>(request)
    const response: AdminFeedbackResponse = {
      id: "r0000000-0000-4000-8000-0000000000aa",
      text: body.text ?? "",
      attachments: [],
      channels: body.channels ?? [],
      deliveries: (body.channels ?? []).map((channel) => ({ channel, status: "sent" as const })),
      author_name: "Администратор",
      created_at: "2026-10-25T10:00:00+05:00",
    }
    return HttpResponse.json(response, { status: 201 })
  }),
]
