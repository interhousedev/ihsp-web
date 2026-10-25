"use client"

import { useCallback, useEffect, useState } from "react"

export const SIDEBAR_STORAGE_KEY = "ihsp.assistant.sidebar"

function read(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed"
  } catch {
    return false
  }
}

/** Whether the desktop sidebar is hidden; remembered in `localStorage` (which may be blocked). */
export function useSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  // The server render and the first client render agree (open); the stored choice is applied right after.
  const [collapsed, setCollapsedState] = useState(false)

  useEffect(() => {
    setCollapsedState(read())
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    try {
      if (value) window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed")
      else window.localStorage.removeItem(SIDEBAR_STORAGE_KEY)
    } catch {
      // Blocked storage: the choice lasts until the page is closed.
    }
  }, [])

  return [collapsed, setCollapsed]
}
