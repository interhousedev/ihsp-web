import { holdLogin } from "./login-hold"
import { clearSessionHint } from "./session-hint"
import { useAuthStore } from "./store"

const CHANNEL_NAME = "ihsp-auth"

type Message = { type: "logout" }

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null
  channel ??= new BroadcastChannel(CHANNEL_NAME)
  return channel
}

/** Tells the other tabs of this browser to drop their tokens (called after a logout). */
export function broadcastLogout(): void {
  const message: Message = { type: "logout" }
  getChannel()?.postMessage(message)
}

/** The tab that logs out is ending the Hydra session; the others wait for it, then reload into the login. */
const RELOAD_DELAY_MS = 1500

function onMessage(event: MessageEvent<Message>): void {
  if (event.data?.type !== "logout") return
  holdLogin(RELOAD_DELAY_MS * 2)
  clearSessionHint()
  useAuthStore.getState().clear()
  if (typeof window !== "undefined") window.setTimeout(() => window.location.reload(), RELOAD_DELAY_MS)
}

/** Starts listening for a logout in another tab; returns the function that stops it. */
export function listenForLogout(): () => void {
  const source = getChannel()
  if (!source) return () => undefined
  source.addEventListener("message", onMessage)
  return () => source.removeEventListener("message", onMessage)
}

export function closeChannel(): void {
  channel?.close()
  channel = null
}
