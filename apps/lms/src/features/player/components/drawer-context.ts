"use client"

import { createContext, useContext } from "react"

/** Lets a link inside the course sidebar close the phone drawer it is shown in; outside a drawer it does nothing. */
export const CloseDrawerContext = createContext<() => void>(() => undefined)

export function useCloseDrawer(): () => void {
  return useContext(CloseDrawerContext)
}
