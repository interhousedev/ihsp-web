import type { ChatCreateBody, ChatMessageBody, ChatPatchBody, ToolCallRejectBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  chatDetailAdmin,
  chatDetailHomework,
  chatDetailPending,
  chatItems,
  turnResultApproved,
  turnResultFor,
  turnResultRejected,
  usageInfo,
} from "../fixtures/ai"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, noContent, notFound, paginate, param, query, readJson } from "./utils"

const detailById = [chatDetailPending, chatDetailHomework, chatDetailAdmin]

export const aiHandlers = [
  http.get(apiUrl("/v1/ai/chats"), ({ request }) => {
    const assistant = query(request).get("assistant")
    return HttpResponse.json(
      paginate(
        chatItems.filter((chat) => !assistant || chat.assistant === assistant),
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
    })
  }),
  http.get(apiUrl("/v1/ai/chats/:id"), ({ params }) => {
    const chat = detailById.find((item) => item.id === param(params, "id"))
    return chat ? HttpResponse.json(chat) : notFound("Chat")
  }),
  http.patch(apiUrl("/v1/ai/chats/:id"), async ({ params, request }) => {
    const chat = chatItems.find((item) => item.id === param(params, "id"))
    if (!chat) return notFound("Chat")
    const body = await readJson<ChatPatchBody>(request)
    return HttpResponse.json({ ...chat, title: body.title ?? chat.title })
  }),
  http.delete(apiUrl("/v1/ai/chats/:id"), () => noContent()),
  http.post(apiUrl("/v1/ai/chats/:id/messages"), async ({ params, request }) => {
    const chat = chatItems.find((item) => item.id === param(params, "id"))
    if (!chat) return notFound("Chat")
    const body = await readJson<ChatMessageBody>(request)
    const detail = detailById.find((item) => item.id === chat.id)
    return HttpResponse.json(turnResultFor(chat, body.text ?? "", (detail?.messages.length ?? 0) + 1))
  }),
  http.post(apiUrl("/v1/ai/chats/:id/tool-calls/:callId/approve"), () => HttpResponse.json(turnResultApproved)),
  http.post(apiUrl("/v1/ai/chats/:id/tool-calls/:callId/reject"), async ({ request }) => {
    const body = await readJson<ToolCallRejectBody>(request)
    return HttpResponse.json(turnResultRejected(body.reason ?? null))
  }),
  http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageInfo)),
]
