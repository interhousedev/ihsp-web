"use client"

import { ApiError, getAiChatQuery } from "@ihsp/api"
import { type ChatTier, useCreateChat } from "@ihsp/features-core"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

type Stored = { chatId: string | null; tier: ChatTier }

/** The chat and tier the popup continues, per user on this device. */
export function dockChatKey(userId: string): string {
  return `ihsp:admission:assistant:chat:${userId}`
}

function read(userId: string): Stored {
  try {
    const raw = window.localStorage.getItem(dockChatKey(userId))
    const parsed = raw ? (JSON.parse(raw) as Partial<Stored>) : {}
    return {
      chatId: typeof parsed.chatId === "string" ? parsed.chatId : null,
      tier: parsed.tier === "fast" ? "fast" : "smart",
    }
  } catch {
    return { chatId: null, tier: "smart" }
  }
}

function write(userId: string, value: Stored): void {
  try {
    window.localStorage.setItem(dockChatKey(userId), JSON.stringify(value))
  } catch {
    // Storage blocked: the chat lives for this page only.
  }
}

/**
 * One chat for the whole session of the popup: the id is kept in storage so it survives route changes and reloads
 * until the user starts another chat. A chat that no longer exists (404) is forgotten and a new one is created.
 * `enabled` defers creating anything until the popup is first opened.
 */
export function useDockChat(userId: string, enabled: boolean) {
  const [stored, setStored] = useState<Stored>({ chatId: null, tier: "smart" })
  const [ready, setReady] = useState(false)
  const create = useCreateChat("admission")
  const creating = useRef(false)

  useEffect(() => {
    setStored(read(userId))
    setReady(true)
  }, [userId])

  const check = useQuery({
    ...getAiChatQuery(stored.chatId ?? ""),
    enabled: enabled && ready && stored.chatId !== null,
  })
  const missing = check.error instanceof ApiError && check.error.status === 404

  const start = useCallback(
    (tier: ChatTier) => {
      if (creating.current) return
      creating.current = true
      create.mutate(
        { tier },
        {
          onSuccess: (chat) => {
            const next = { chatId: chat.id, tier }
            write(userId, next)
            setStored(next)
          },
          onSettled: () => {
            creating.current = false
          },
        },
      )
    },
    [create, userId],
  )

  useEffect(() => {
    if (enabled && ready && (stored.chatId === null || missing)) start(stored.tier)
  }, [enabled, ready, stored.chatId, stored.tier, missing, start])

  return {
    chatId: missing ? null : stored.chatId,
    tier: stored.tier,
    failed: create.isError,
    /** Another chat on the given tier (also the "new chat" button). */
    restart: start,
    retry: () => start(stored.tier),
  }
}
