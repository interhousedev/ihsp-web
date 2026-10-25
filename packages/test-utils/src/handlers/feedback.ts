import type { FeedbackCreateBody, FeedbackDetailOut, FeedbackOut } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, notFound, param, readJson } from "./utils"

/** The caller's reports as the mocked backend returns them (`GET /v1/feedback/mine`), newest first. */
export const feedbackFixtures: FeedbackDetailOut[] = [
  {
    id: "7b1c0000-0000-4000-8000-000000000001",
    kind: "bug",
    area: "my",
    title: "Расписание не открывается",
    description: "На телефоне страница расписания пустая.",
    status: "in_review",
    source: "web",
    created_at: "2026-10-20T09:15:00+05:00",
    attachments: [
      {
        file_id: "f0000000-0000-4000-8000-000000000001",
        name: "screen.png",
        mime: "image/png",
        size: 2048,
        download_url: "https://storage.ihsu.test/feedback/f0000000-0000-4000-8000-000000000001?sig=test",
      },
    ],
    response_count: 1,
    responses: [
      {
        id: "r0000000-0000-4000-8000-000000000001",
        text: "Спасибо, проблему воспроизвели. Исправим в следующем обновлении.",
        attachments: [
          {
            file_id: "f0000000-0000-4000-8000-000000000002",
            name: "fix.png",
            mime: "image/png",
            size: 1024,
            download_url: "https://storage.ihsu.test/feedback/f0000000-0000-4000-8000-000000000002?sig=test",
          },
        ],
        channels: ["telegram"],
        deliveries: [{ channel: "telegram", status: "sent" }],
        author_name: "Администратор",
        created_at: "2026-10-21T11:00:00+05:00",
      },
    ],
  },
  {
    id: "7b1c0000-0000-4000-8000-000000000002",
    kind: "idea",
    area: "notebooks",
    title: "Экспорт блокнота в PDF",
    description: "Хочется сохранять конспект одним файлом.",
    status: "new",
    source: "bot",
    created_at: "2026-10-22T16:40:00+05:00",
    attachments: [],
    response_count: 0,
    responses: [],
  },
]

/** `POST /v1/feedback` echoes the body as a new report; `feedbackFixtures` is the list the `mine` and detail reads use. */
function createdReport(body: Partial<FeedbackCreateBody>): FeedbackOut {
  return {
    id: "7b1c0000-0000-4000-8000-0000000000ff",
    kind: body.kind ?? "other",
    area: body.area ?? "other",
    title: body.title ?? "",
    description: body.description ?? "",
    status: "new",
    source: "web",
    created_at: "2026-10-25T10:00:00+05:00",
    attachments: (body.attachment_file_ids ?? []).map((file_id) => ({
      file_id,
      name: "attachment",
      mime: "image/png",
      size: 1,
      download_url: `https://storage.ihsu.test/feedback/${file_id}?sig=test`,
    })),
    response_count: 0,
  }
}

export const feedbackHandlers = [
  http.post(apiUrl("/v1/feedback"), async ({ request }) => {
    const body = await readJson<FeedbackCreateBody>(request)
    return HttpResponse.json(createdReport(body), { status: 201 })
  }),
  http.get(apiUrl("/v1/feedback/mine"), () => {
    const items: FeedbackOut[] = feedbackFixtures.map(({ responses: _responses, ...item }) => item)
    return HttpResponse.json({ items })
  }),
  http.get(apiUrl("/v1/feedback/:id"), ({ params }) => {
    const found = feedbackFixtures.find((item) => item.id === param(params, "id"))
    return found ? HttpResponse.json(found) : notFound("Feedback")
  }),
]
