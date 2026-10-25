import type { ChatDetail, ChatMessageView, ToolCallView, TurnResult } from "@ihsp/api"

function mergeToolCalls(message: ChatMessageView, updates: Map<string, ToolCallView>): ChatMessageView {
  if (message.tool_calls.length === 0) return message
  return { ...message, tool_calls: message.tool_calls.map((call) => updates.get(call.id) ?? call) }
}

/**
 * Applies the result of a turn (send, approve, reject) to the cached chat: new messages are added or replaced by
 * `seq`, and tool calls that appear again in a newer message (an approval that finished) update their older copy.
 */
export function applyTurn(detail: ChatDetail, turn: TurnResult): ChatDetail {
  const updates = new Map<string, ToolCallView>()
  for (const message of turn.new_messages) {
    for (const call of message.tool_calls) updates.set(call.id, call)
  }
  const bySeq = new Map<number, ChatMessageView>()
  for (const message of detail.messages) bySeq.set(message.seq, mergeToolCalls(message, updates))
  for (const message of turn.new_messages) bySeq.set(message.seq, message)
  const messages = [...bySeq.values()].toSorted((a, b) => a.seq - b.seq)
  return { ...detail, ...turn.chat, messages }
}
