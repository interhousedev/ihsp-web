/** Mailpit (dev compose, http://localhost:8025): the inbox of every mail the backend sends. */

import { URLS } from "./env"

type MailpitAddress = { Name: string; Address: string }
type MailpitSummary = {
  ID: string
  Subject: string
  Created: string
  To: MailpitAddress[]
  Snippet: string
}
type MailpitMessage = { ID: string; Subject: string; Text: string; HTML: string; To: MailpitAddress[] }

async function mailpit<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${URLS.mailpit}${path}`, init)
  if (!response.ok) throw new Error(`Mailpit ${init?.method ?? "GET"} ${path} answered ${response.status}`)
  return (await response.json()) as T
}

export async function listMessages(limit = 50): Promise<MailpitSummary[]> {
  const body = await mailpit<{ messages: MailpitSummary[] }>(`/api/v1/messages?limit=${limit}`)
  return body.messages
}

export async function readMessage(id: string): Promise<MailpitMessage> {
  return mailpit<MailpitMessage>(`/api/v1/message/${encodeURIComponent(id)}`)
}

/** Six digits that are not part of a longer number. */
const CODE = /(?<!\d)(\d{6})(?!\d)/

export type CodeQuery = {
  /** Only mails received at or after this time (milliseconds); take it before triggering the mail. */
  since: number
  /** Recipient address (case-insensitive); omit when the account's address is not known. */
  to?: string
  /** Only mails whose subject or text contains this text. */
  contains?: string | RegExp
  timeoutMs?: number
}

/** Waits for a mail and returns the six-digit code in it (login second factor, registration, email change…). */
export async function waitForCode(query: CodeQuery): Promise<string> {
  const deadline = Date.now() + (query.timeoutMs ?? 60_000)
  const seen = new Set<string>()
  while (Date.now() < deadline) {
    const summaries = await listMessages()
    // Newest first.
    for (const summary of summaries) {
      if (seen.has(summary.ID)) continue
      if (Date.parse(summary.Created) < query.since - 2_000) continue
      if (query.to && !summary.To.some((to) => to.Address.toLowerCase() === query.to?.toLowerCase())) continue
      const message = await readMessage(summary.ID)
      const haystack = `${message.Subject}\n${message.Text}`
      if (query.contains) {
        const matches =
          typeof query.contains === "string" ? haystack.includes(query.contains) : query.contains.test(haystack)
        if (!matches) {
          seen.add(summary.ID)
          continue
        }
      }
      const code = CODE.exec(message.Text || message.HTML)?.[1]
      if (code) return code
      seen.add(summary.ID)
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(
    `No mail with a code arrived in Mailpit (${JSON.stringify({ ...query, contains: String(query.contains ?? "") })})`,
  )
}

/** Checks that Mailpit answers; used by the global setup. */
export async function mailpitReachable(): Promise<boolean> {
  try {
    await mailpit<unknown>("/api/v1/info")
    return true
  } catch {
    return false
  }
}
