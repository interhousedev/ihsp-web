/**
 * The fake Telegram of the dev stack (`IHSP_TELEGRAM__MODE=fake`):
 *  - the backend never calls Telegram; every message it would send is pushed to the Redis list `fake-telegram:outbox`
 *    (newest first, JSON per entry, `message_id` from the counter `fake-telegram:message-id`);
 *  - the mini app `initData` is signed with the bot token, so the tests sign their own and "link" a Telegram account
 *    through `POST /v1/id/telegram/login`, exactly as the login page inside Telegram does.
 */

import { createHmac } from "node:crypto"
import net from "node:net"
import { BOT_TOKEN, URLS } from "./env"

// --- Redis (RESP2 over one short connection per command; no dependency needed) ---

type Resp = string | number | null | Resp[]

function encode(args: string[]): string {
  return `*${args.length}\r\n${args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join("")}`
}

/** Parses one RESP value from `buffer` at `offset`; returns null when the data is not complete yet. */
function parse(buffer: Buffer, offset: number): { value: Resp; next: number } | null {
  if (offset >= buffer.length) return null
  const type = String.fromCharCode(buffer[offset] ?? 0)
  const lineEnd = buffer.indexOf("\r\n", offset)
  if (lineEnd === -1) return null
  const line = buffer.toString("utf8", offset + 1, lineEnd)
  const afterLine = lineEnd + 2
  if (type === "+") return { value: line, next: afterLine }
  if (type === "-") throw new Error(`Redis: ${line}`)
  if (type === ":") return { value: Number(line), next: afterLine }
  if (type === "$") {
    const length = Number(line)
    if (length === -1) return { value: null, next: afterLine }
    if (buffer.length < afterLine + length + 2) return null
    return { value: buffer.toString("utf8", afterLine, afterLine + length), next: afterLine + length + 2 }
  }
  if (type === "*") {
    const count = Number(line)
    if (count === -1) return { value: null, next: afterLine }
    const items: Resp[] = []
    let next = afterLine
    for (let index = 0; index < count; index += 1) {
      const item = parse(buffer, next)
      if (!item) return null
      items.push(item.value)
      next = item.next
    }
    return { value: items, next }
  }
  throw new Error(`Redis: unexpected reply type ${type}`)
}

export async function redisCommand(...args: string[]): Promise<Resp> {
  const url = new URL(URLS.redis)
  const database = url.pathname.replace("/", "")
  const commands: string[][] = []
  if (url.password) commands.push(["AUTH", ...(url.username ? [url.username] : []), decodeURIComponent(url.password)])
  if (database) commands.push(["SELECT", database])
  commands.push(args)

  return new Promise<Resp>((resolve, reject) => {
    const socket = net.connect({ host: url.hostname, port: Number(url.port || 6379) })
    let received = Buffer.alloc(0)
    let offset = 0
    let answered = 0
    let last: Resp = null
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error("Redis: timeout"))
    }, 10_000)
    socket.on("connect", () => socket.write(commands.map(encode).join("")))
    socket.on("data", (chunk) => {
      received = Buffer.concat([received, chunk])
      try {
        for (;;) {
          const reply = parse(received, offset)
          if (!reply) break
          offset = reply.next
          last = reply.value
          answered += 1
          if (answered === commands.length) {
            clearTimeout(timer)
            socket.end()
            resolve(last)
            return
          }
        }
      } catch (error) {
        clearTimeout(timer)
        socket.destroy()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    socket.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

export async function redisReachable(): Promise<boolean> {
  try {
    return (await redisCommand("PING")) === "PONG"
  } catch {
    return false
  }
}

// --- The fake outbox ---

export type FakeTelegramEntry = {
  kind: "message" | "document" | "delete"
  message_id: number
  chat_id: number
  text_html?: string
  caption_html?: string | null
  filename?: string
  buttons?: { text: string; url?: string; web_app?: { url: string } }[][] | null
}

/** The newest `limit` entries, newest first. */
export async function telegramOutbox(limit = 100): Promise<FakeTelegramEntry[]> {
  const rows = await redisCommand("LRANGE", "fake-telegram:outbox", "0", String(limit - 1))
  if (!Array.isArray(rows)) return []
  return rows.map((row) => JSON.parse(String(row)) as FakeTelegramEntry)
}

/** The id of the last message sent so far; take it before the action and wait for entries above it. */
export async function lastTelegramMessageId(): Promise<number> {
  const value = await redisCommand("GET", "fake-telegram:message-id")
  return value === null ? 0 : Number(value)
}

export type WaitForTelegram = {
  afterMessageId: number
  chatId?: number
  /** Text (HTML) or caption must contain this. */
  contains?: string
  timeoutMs?: number
}

/** Waits until the backend "sends" a message that matches; returns it. */
export async function waitForTelegram(query: WaitForTelegram): Promise<FakeTelegramEntry> {
  const deadline = Date.now() + (query.timeoutMs ?? 60_000)
  while (Date.now() < deadline) {
    const entries = await telegramOutbox(200)
    const hit = entries.find((entry) => {
      if (entry.message_id <= query.afterMessageId) return false
      if (entry.kind === "delete") return false
      if (query.chatId !== undefined && entry.chat_id !== query.chatId) return false
      if (query.contains) {
        const text = `${entry.text_html ?? ""}\n${entry.caption_html ?? ""}`
        if (!text.includes(query.contains)) return false
      }
      return true
    })
    if (hit) return hit
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`The fake Telegram outbox got no message matching ${JSON.stringify(query)}`)
}

// --- Signed mini app initData and linking ---

export type FakeTelegramUser = { id: number; first_name: string; username?: string; language_code?: string }

/** `initData` as Telegram signs it for the mini app (HMAC with the secret derived from the bot token). */
export function signInitData(user: FakeTelegramUser, options: { authDate?: number; botToken?: string } = {}): string {
  const fields = new URLSearchParams({
    auth_date: String(options.authDate ?? Math.floor(Date.now() / 1000)),
    query_id: `AAE-e2e-${user.id}`,
    user: JSON.stringify(user),
  })
  const check = [...fields.entries()]
    .toSorted(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  const secret = createHmac("sha256", "WebAppData")
    .update(options.botToken ?? BOT_TOKEN)
    .digest()
  fields.set("hash", createHmac("sha256", secret).update(check).digest("hex"))
  return fields.toString()
}

/** The hash a browser puts after `#` to open a page "inside Telegram" (`tgWebAppData`, read by `@tma.js/sdk`). */
export function miniAppHash(initData: string): string {
  const params = new URLSearchParams({
    tgWebAppData: initData,
    tgWebAppVersion: "8.0",
    tgWebAppPlatform: "web",
    tgWebAppThemeParams: JSON.stringify({ bg_color: "#ffffff", text_color: "#000000" }),
  })
  return `#${params.toString()}`
}

/** Demo Telegram users: stable ids so that a repeated run links the same account again. */
export const TELEGRAM_USERS = {
  student: { id: 7_000_001, first_name: "Aleksey", username: "e2e_student", language_code: "en" },
  teacher: { id: 7_000_002, first_name: "Gavxar", username: "e2e_teacher", language_code: "en" },
  admin: { id: 7_000_003, first_name: "Admin", username: "e2e_admin", language_code: "en" },
} as const satisfies Record<string, FakeTelegramUser>

/**
 * Links a fake Telegram account to a user: `POST /v1/id/telegram/login` with signed `initData` and the password,
 * the call the login page of the mini app makes. Idempotent for the same Telegram user and login.
 * Administration also needs the second factor, so link only students and teachers.
 */
export async function linkTelegram(user: FakeTelegramUser, login: string, password: string): Promise<void> {
  const response = await fetch(`${URLS.api}/v1/id/telegram/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ init_data: signInitData(user), login, password }),
  })
  if (!response.ok) {
    throw new Error(`Linking fake Telegram ${user.id} to ${login} failed: ${response.status} ${await response.text()}`)
  }
}
