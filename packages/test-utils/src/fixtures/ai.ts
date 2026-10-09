import type {
  ChatDetail,
  ChatItem,
  ChatMessageView,
  ToolCallView,
  TurnResult,
  UsageInfo,
  WebQuota,
  WebResult,
} from "@ihsp/api"
import { ids } from "./world"

export const usageInfo: UsageInfo = {
  session: { used: 12_000, limit: 100_000, resets_at: "2026-10-07T08:00:00Z" },
  day: { used: 48_000, limit: 300_000, resets_at: "2026-10-08T00:00:00Z" },
}

/** Both limits used up: the input is disabled until `resets_at`. */
export const usageLimitReached: UsageInfo = {
  session: { used: 100_000, limit: 100_000, resets_at: "2026-10-07T08:00:00Z" },
  day: { used: 120_000, limit: 300_000, resets_at: "2026-10-08T00:00:00Z" },
}

export const chatPending: ChatItem = {
  id: ids.chat,
  assistant: "student",
  title: "Kinematics revision",
  last_message_at: "2026-10-07T04:50:00Z",
  pending_approvals: 1,
  course_id: null,
  tier: "fast",
}

export const chatHomework: ChatItem = {
  id: ids.chat2,
  assistant: "student",
  title: "Homework help",
  last_message_at: "2026-10-05T17:20:00Z",
  pending_approvals: 0,
  course_id: null,
  tier: "fast",
}

export const chatAdmin: ChatItem = {
  id: "0000000a-0000-4000-8000-0000000000aa",
  assistant: "admin",
  title: "Weekly attendance",
  last_message_at: "2026-10-06T12:00:00Z",
  pending_approvals: 0,
  course_id: null,
  tier: "fast",
}

export const chatItems: ChatItem[] = [chatPending, chatHomework, chatAdmin]

export const toolCallLookup: ToolCallView = {
  id: "0000000b-0000-4000-8000-0000000000a1",
  tool: "get_timetable",
  access: "read",
  status: "done",
  note: "Looked up your timetable",
  preview: null,
  reject_reason: null,
  expires_at: null,
}

/** A write action waiting for the user's approval; one field is marked sensitive. */
export const toolCallPending: ToolCallView = {
  id: ids.toolCallPending,
  tool: "create_flashcard_set",
  access: "write",
  status: "pending_approval",
  note: "Create a flash card set",
  preview: {
    title: "Create flash card set",
    fields: [
      { label: "Title", value: "Physics: kinematics", sensitive: false },
      { label: "Cards", value: "12", sensitive: false },
      { label: "Visibility", value: "Public link after approval", sensitive: true },
    ],
    items: ["What is velocity?", "What is acceleration?", "Uniform motion formula"],
  },
  reject_reason: null,
  expires_at: "2026-10-07T05:50:00Z",
}

export const messageUser: ChatMessageView = {
  seq: 1,
  role: "user",
  text: "Make flash cards from my kinematics notes",
  file_ids: [ids.file],
  tool_calls: [],
  created_at: "2026-10-07T04:48:00Z",
  web: [],
}

export const messageAssistantPending: ChatMessageView = {
  seq: 2,
  role: "assistant",
  text: "I read your notes and prepared a set of 12 cards. Please approve the action below.",
  file_ids: [],
  tool_calls: [toolCallLookup, toolCallPending],
  created_at: "2026-10-07T04:50:00Z",
  web: [],
}

export const chatDetailPending: ChatDetail = {
  ...chatPending,
  messages: [messageUser, messageAssistantPending],
  shared: false,
}

export const chatDetailHomework: ChatDetail = {
  ...chatHomework,
  messages: [
    { ...messageUser, text: "Explain Newton's second law", file_ids: [], created_at: "2026-10-05T17:18:00Z" },
    {
      ...messageAssistantPending,
      text: "Newton's second law says that **force = mass x acceleration**.",
      tool_calls: [],
      created_at: "2026-10-05T17:20:00Z",
    },
  ],
  shared: true,
}

export const chatDetailAdmin: ChatDetail = { ...chatAdmin, messages: [], shared: false }

/** Result of sending a message that leads to an immediate answer. */
export function turnResultFor(chat: ChatItem, text: string, nextSeq = 3): TurnResult {
  return {
    chat: { ...chat, last_message_at: "2026-10-07T05:12:00Z" },
    new_messages: [
      {
        seq: nextSeq,
        role: "user",
        text,
        file_ids: [],
        tool_calls: [],
        created_at: "2026-10-07T05:12:00Z",
        web: [],
      },
      {
        seq: nextSeq + 1,
        role: "assistant",
        text: `You asked: "${text}". Here is a short answer.`,
        file_ids: [],
        tool_calls: [],
        created_at: "2026-10-07T05:12:05Z",
        web: [],
      },
    ],
    status: "done",
    usage: usageInfo,
  }
}

/** Result of approving the pending tool call. */
export const turnResultApproved: TurnResult = {
  chat: { ...chatPending, pending_approvals: 0 },
  new_messages: [
    {
      seq: 3,
      role: "assistant",
      text: "Done: the set **Physics: kinematics** with 12 cards is in your flash cards.",
      file_ids: [],
      tool_calls: [{ ...toolCallPending, status: "done", expires_at: null }],
      created_at: "2026-10-07T05:13:00Z",
      web: [],
    },
  ],
  status: "done",
  usage: usageInfo,
}

/** Result of rejecting the pending tool call. */
export function turnResultRejected(reason: string | null): TurnResult {
  return {
    chat: { ...chatPending, pending_approvals: 0 },
    new_messages: [
      {
        seq: 3,
        role: "assistant",
        text: "Understood, I did not create the set.",
        file_ids: [],
        tool_calls: [{ ...toolCallPending, status: "rejected", reject_reason: reason, expires_at: null }],
        created_at: "2026-10-07T05:13:00Z",
        web: [],
      },
    ],
    status: "done",
    usage: usageInfo,
  }
}

// - - - Web search - - -

/** Web search on, 6 of 10 searches used today. */
export const webQuota: WebQuota = {
  enabled: true,
  used: 6,
  limit: 10,
  remaining: 4,
  resets_at: "2026-10-08T00:00:00Z",
  max_results: 5,
  deep_cost: 3,
}

/** Web search turned off for this deployment: the switch and Discover stay hidden. */
export const webQuotaDisabled: WebQuota = { ...webQuota, enabled: false, used: 0, limit: 0, remaining: 0 }

/** All of today's searches used. */
export const webQuotaSpent: WebQuota = { ...webQuota, used: 10, remaining: 0 }

export const webResults: WebResult[] = [
  {
    n: 1,
    title: "Photosynthesis - Wikipedia",
    url: "https://uz.wikipedia.org/wiki/Fotosintez",
    site: "uz.wikipedia.org",
    snippet: "Photosynthesis is the process by which plants turn light, water and carbon dioxide into sugar.",
    why: "Defines the process",
    cited: true,
  },
  {
    n: 2,
    title: "The Calvin cycle (Khan Academy)",
    url: "https://www.khanacademy.org/science/biology/photosynthesis/calvin-cycle",
    site: "khanacademy.org",
    snippet: "The Calvin cycle uses ATP and NADPH to fix carbon dioxide into three-carbon sugars in the stroma.",
    why: "Explains the light-independent stage",
    cited: false,
  },
]

/** An assistant answer with a web chip. */
export const messageAssistantWeb: ChatMessageView = {
  seq: 4,
  role: "assistant",
  text: "Plants turn light into sugar ⟦w1⟧. The second stage happens in the stroma.",
  file_ids: [],
  tool_calls: [],
  created_at: "2026-10-07T05:14:00Z",
  web: webResults,
}

/** Result of a turn sent with the web switch on. */
export function turnResultWeb(chat: ChatItem, text: string, nextSeq = 3): TurnResult {
  const base = turnResultFor(chat, text, nextSeq)
  const [user, answer] = base.new_messages
  return {
    ...base,
    new_messages: [user!, { ...answer!, text: messageAssistantWeb.text, web: webResults }],
  }
}
