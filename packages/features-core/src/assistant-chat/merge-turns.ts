import type { AgentStep, ChatMessageView, ToolCallView } from "@ihsp/api"

function noteStep(message: ChatMessageView): AgentStep {
  return { id: `note-${message.seq}`, kind: "think", label: message.text, status: "done", duration_ms: 0 }
}

/** Calls of the whole answer in order; a call stored again later (an approval that finished) keeps its newest copy. */
function mergeCalls(messages: readonly ChatMessageView[]): ToolCallView[] {
  const byId = new Map<string, ToolCallView>()
  for (const message of messages) {
    for (const call of message.tool_calls) {
      byId.delete(call.id)
      byId.set(call.id, call)
    }
  }
  return [...byId.values()]
}

/** One display item of an older answer stored as several messages: steps and notes combined, the last text shown. */
function mergeAnswer(run: readonly ChatMessageView[]): ChatMessageView {
  const last = run[run.length - 1] as ChatMessageView
  const steps: AgentStep[] = []
  const progress: string[] = []
  for (const message of run) {
    steps.push(...(message.steps ?? []))
    progress.push(...(message.progress ?? []))
    if (message !== last && message.text.trim()) {
      steps.push(noteStep(message))
      progress.push(message.text)
    }
  }
  const web = last.web.length > 0 ? last.web : (run.findLast((message) => message.web.length > 0)?.web ?? [])
  return { ...last, tool_calls: mergeCalls(run), steps, progress, web }
}

/**
 * The chat as the user reads it: the assistant messages between two user messages are one answer. Chats stored
 * before answers were kept in one message have a message per tool round; they are shown as one item whose steps
 * hold the earlier texts as notes and whose text is the last one. The item keeps the `seq` of its last message.
 */
export function mergeAssistantTurns(messages: readonly ChatMessageView[]): ChatMessageView[] {
  const out: ChatMessageView[] = []
  let run: ChatMessageView[] = []
  const flush = () => {
    if (run.length === 1) out.push(run[0] as ChatMessageView)
    else if (run.length > 1) out.push(mergeAnswer(run))
    run = []
  }
  for (const message of messages) {
    if (message.role === "assistant") {
      run.push(message)
      continue
    }
    flush()
    out.push(message)
  }
  flush()
  return out
}
