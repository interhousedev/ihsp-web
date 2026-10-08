// Public (anonymous) endpoints: shared chats and flash card sets, abuse reports, short links, room pages
// (backend § API contract → "Links, shares, lesson resources, room pages (B7)").

export type PublicShare = {
  kind: "chat" | "flashcard_set"
  title: string
  author_first_name: string
  created_at: string
  chat: { messages: { role: "user" | "assistant"; text: string; tool_notes: string[] }[] } | null
  flashcards: { cards: { id: string; front: string; back: string }[] } | null
}

export type ReportReason = "phishing" | "malware" | "personal_data" | "offensive" | "other"
export type ReportBody = { slug: string; reason: ReportReason; comment?: string }

/** Room page query: `pin` unlocks it, `date` shows another day. */
export type RoomPageParams = { pin?: string; date?: string }
