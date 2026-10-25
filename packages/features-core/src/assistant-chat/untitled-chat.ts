/** The placeholder titles the backend gives a chat before its first message (`ai-chat-new` in ru, en and uz). */
const PLACEHOLDER_TITLES = new Set(["новый чат", "new chat", "yangi chat"])

/**
 * Whether the chat still has its placeholder title, i.e. no message was ever sent in it (the first message replaces
 * the title). Such chats are not listed under Recent.
 */
export function isUntitledChat(title: string): boolean {
  return PLACEHOLDER_TITLES.has(title.trim().toLowerCase())
}
