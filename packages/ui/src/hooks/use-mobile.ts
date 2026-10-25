"use client"

import * as React from "react"

/** Phones and small tablets: below Tailwind's `md` breakpoint. Tables become cards, the sidebar becomes a sheet. */
export const MOBILE_BREAKPOINT = 768

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT
const getServerSnapshot = () => false

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
