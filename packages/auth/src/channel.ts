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

function onMessage(event: MessageEvent<Message>): void {
  if (event.data?.type === "logout") useAuthStore.getState().clear()
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
