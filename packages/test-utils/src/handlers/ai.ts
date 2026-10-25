import type { ChatCreateBody, ChatMessageBody, ChatPatchBody, ToolCallRejectBody, TurnResult } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  chatDetailAdmin,
  chatDetailHomework,
  chatDetailPending,
  chatItems,
  turnResultApproved,
  turnResultFor,
  turnResultRejected,
  turnResultWeb,
  usageInfo,
} from "../fixtures/ai"
import { authorChat, authorChatDetail, authorTurnApproved } from "../fixtures/course-workspace"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, matches, nextId, noContent, notFound, paginate, param, query, readJson } from "./utils"
import { spendWebSearch } from "./web-search"

const detailById = [chatDetailPending, chatDetailHomework, chatDetailAdmin, authorChatDetail]
/** Every chat the handlers know, the author chat of the course workspace included (it is never in the student lists). */
const allChats = [...chatItems, authorChat]

export const aiHandlers = [
  http.get(apiUrl("/v1/ai/chats"), ({ request }) => {
    const assistant = query(request).get("assistant")
    const q = query(request).get("q")
    const courseId = query(request).get("course_id")
    if (assistant === "lms_author") {
      return HttpResponse.json(
        paginate(
          [authorChat].filter((chat) => (!courseId || chat.course_id === courseId) && matches(chat.title, q)),
          request,
        ),
      )
    }
    return HttpResponse.json(
      paginate(
        chatItems.filter((chat) => (!assistant || chat.assistant === assistant) && matches(chat.title, q)),
        request,
      ),
    )
  }),
  http.post(apiUrl("/v1/ai/chats"), async ({ request }) => {
    const body = await readJson<ChatCreateBody>(request)
    return HttpResponse.json({
      id: nextId(10),
      assistant: body.assistant ?? "student",
      title: "New chat",
      last_message_at: FIXTURE_NOW,
      pending_approvals: 0,
      course_id: body.course_id ?? null,
      tier: body.tier ?? "fast",
    })
  }),
  http.get(apiUrl("/v1/ai/chats/:id"), ({ params }) => {
    const chat = detailById.find((item) => item.id === param(params, "id"))
    return chat ? HttpResponse.json(chat) : notFound("Chat")
  }),
  http.patch(apiUrl("/v1/ai/chats/:id"), async ({ params, request }) => {
    const chat = allChats.find((item) => item.id === param(params, "id"))
    if (!chat) return notFound("Chat")
    const body = await readJson<ChatPatchBody>(request)
    return HttpResponse.json({ ...chat, title: body.title ?? chat.title })
  }),
  http.delete(apiUrl("/v1/ai/chats/:id"), () => noContent()),
  http.post(apiUrl("/v1/ai/chats/:id/messages"), async ({ params, request }) => {
    const chat = allChats.find((item) => item.id === param(params, "id"))
    if (!chat) return notFound("Chat")
    const body = await readJson<ChatMessageBody>(request)
    const detail = detailById.find((item) => item.id === chat.id)
    const nextSeq = (detail?.messages.length ?? 0) + 1
    if (body.web_search) {
      const refused = spendWebSearch()
      return refused ?? HttpResponse.json(turnResultWeb(chat, body.text ?? "", nextSeq))
    }
    const result = turnResultFor(chat, body.text ?? "", nextSeq)
    return wantsStream(request) ? aiTurnStream(result) : HttpResponse.json(result)
  }),
  http.post(apiUrl("/v1/ai/chats/:id/regenerate"), ({ params }) => {
    const chat = allChats.find((item) => item.id === param(params, "id"))
    if (!chat) return notFound("Chat")
    const detail = detailById.find((item) => item.id === chat.id)
    const last = detail?.messages[detail.messages.length - 1]
    const result: TurnResult = {
      chat,
      new_messages: [
        {
          seq: last?.seq ?? 2,
          role: "assistant",
          text: "Here is another answer.",
          file_ids: [],
          tool_calls: [],
          created_at: FIXTURE_NOW,
          web: [],
          feedback: null,
        },
      ],
      status: "done",
      usage: usageInfo,
    }
    return HttpResponse.json(result)
  }),
  http.post(apiUrl("/v1/ai/chats/:id/messages/:seq/feedback"), ({ params }) => {
    const chat = allChats.find((item) => item.id === param(params, "id"))
    return chat ? noContent() : notFound("Chat")
  }),
  http.post(apiUrl("/v1/ai/chats/:id/tool-calls/:callId/approve"), ({ params }) =>
    HttpResponse.json(param(params, "id") === authorChat.id ? authorTurnApproved : turnResultApproved),
  ),
  http.post(apiUrl("/v1/ai/chats/:id/tool-calls/:callId/reject"), async ({ request }) => {
    const body = await readJson<ToolCallRejectBody>(request)
    return HttpResponse.json(turnResultRejected(body.reason ?? null))
  }),
  http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageInfo)),
]

function wantsStream(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("text/event-stream")
}

// TODO(contract): the SSE variant of POST /v1/ai/chats/{id}/messages (status, step, delta, done).
/** The events of a turn: a status line, one finished step, the answer word by word, then the stored result. */
export function aiTurnStream(result: TurnResult): Response {
  const encoder = new TextEncoder()
  const answer = result.new_messages.findLast((message) => message.role === "assistant")
  const words = (answer?.text ?? "").split(/(?<=\s)/).filter(Boolean)
  const step = { id: "step-1", kind: "tool", label: "get_my_subjects", status: "done", duration_ms: 5 }
  const events: { event: string; data: unknown }[] = [
    { event: "status", data: { text: "Thinking…" } },
    { event: "step", data: step },
    ...words.map((text) => ({ event: "delta", data: { text } })),
    { event: "done", data: result },
  ]
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const item of events) {
        controller.enqueue(encoder.encode(`event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`))
      }
      controller.close()
    },
  })
  return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } })
}
