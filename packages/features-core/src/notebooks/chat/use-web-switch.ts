"use client"

import { useCallback, useState } from "react"

/** The web switch of a notebook chat is remembered for the browser session under this key. */
export function webSwitchKey(notebookId: string): string {
  return `ihsp.notebook.web.${notebookId}`
}

function readSwitch(notebookId: string): boolean {
  try {
    return window.sessionStorage.getItem(webSwitchKey(notebookId)) === "1"
  } catch {
    return false
  }
}

function writeSwitch(notebookId: string, on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(webSwitchKey(notebookId), "1")
    else window.sessionStorage.removeItem(webSwitchKey(notebookId))
  } catch {
    // Blocked storage: the switch still works until the page is closed.
  }
}

/**
 * "Search the web too" of one notebook chat: off by default, remembered per notebook in `sessionStorage` so it
 * survives a reload of the same notebook and never leaks into another one.
 */
export function useWebSwitch(notebookId: string): readonly [boolean, (on: boolean) => void] {
  const [state, setState] = useState(() => ({ id: notebookId, on: readSwitch(notebookId) }))
  let current = state
  if (state.id !== notebookId) {
    // Another notebook opened in the same component: read its own switch.
    current = { id: notebookId, on: readSwitch(notebookId) }
    setState(current)
  }
  const set = useCallback(
    (on: boolean) => {
      writeSwitch(notebookId, on)
      setState({ id: notebookId, on })
    },
    [notebookId],
  )
  return [current.on, set]
}
