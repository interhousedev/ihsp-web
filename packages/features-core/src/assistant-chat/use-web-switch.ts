"use client"

import { useCallback, useState } from "react"

const KEY_PREFIX = "ihsp.assistant.web."
const HOME = "home"

/** Where the web switch of a chat is remembered; the home composer (no chat yet) uses `…web.home`. */
export function webSwitchKey(chatId?: string): string {
  return `${KEY_PREFIX}${chatId ?? HOME}`
}

/** Whether the switch was left on for this chat in this tab; `false` when the storage is blocked. */
export function readWebSwitch(chatId?: string): boolean {
  try {
    return window.sessionStorage.getItem(webSwitchKey(chatId)) === "1"
  } catch {
    return false
  }
}

/** Remembers the switch of a chat for this tab (the key is removed when it goes off); blocked storage is ignored. */
export function writeWebSwitch(chatId: string | undefined, on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(webSwitchKey(chatId), "1")
    else window.sessionStorage.removeItem(webSwitchKey(chatId))
  } catch {
    // The switch still works for this page view, it is only not remembered.
  }
}

/**
 * The web-search switch of the assistant composer: off by default, remembered per chat in `sessionStorage`, and read
 * again when the composer is shown for another chat.
 */
export function useWebSwitch(chatId?: string): [boolean, (on: boolean) => void] {
  const [state, setState] = useState(() => ({ chatId, on: readWebSwitch(chatId) }))
  let current = state
  if (state.chatId !== chatId) {
    current = { chatId, on: readWebSwitch(chatId) }
    setState(current)
  }
  const setOn = useCallback(
    (on: boolean) => {
      setState({ chatId, on })
      writeWebSwitch(chatId, on)
    },
    [chatId],
  )
  return [current.on, setOn]
}
