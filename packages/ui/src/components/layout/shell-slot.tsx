"use client"

import { createContext, useContext } from "react"

/**
 * Where a shell control is drawn: `sidebar` (the desktop panel, from 768 px: popups open to the side) or `bar` (the
 * compact floating top bar of phones). The shell renders every control once and tells it where it is.
 */
export type ShellSlot = "sidebar" | "bar"

export const ShellSlotContext = createContext<ShellSlot>("bar")

export function useShellSlot(): ShellSlot {
  return useContext(ShellSlotContext)
}
