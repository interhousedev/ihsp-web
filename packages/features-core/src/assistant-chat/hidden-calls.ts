import type { ChatMessageView } from "@ihsp/api"

/** For every message, the tool calls that an earlier message already shows (an approved call appears again later). */
export function hiddenCallsPerMessage(messages: ChatMessageView[]): ReadonlySet<string>[] {
  const seen = new Set<string>()
  return messages.map((message) => {
    const hidden = new Set(seen)
    for (const call of message.tool_calls) seen.add(call.id)
    return hidden
  })
}
