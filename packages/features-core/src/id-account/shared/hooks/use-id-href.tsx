"use client"

import { createContext, useCallback, useContext, type ReactNode } from "react"

const IdBaseContext = createContext("")

/**
 * The account components link to pages of the id app (`/security/password/`). Inside the id app those are routes of
 * the same site; another app wraps them in this provider with the origin of the id app (`ID_URL`).
 */
export function IdAccountBaseProvider({ base, children }: { base: string; children: ReactNode }) {
  return <IdBaseContext.Provider value={base.replace(/\/$/, "")}>{children}</IdBaseContext.Provider>
}

/** Resolves an id-app path against the provider's origin; `{ external }` is true when it leaves the current site. */
export function useIdHref(): (href: string) => { href: string; external: boolean } {
  const base = useContext(IdBaseContext)
  return useCallback(
    (href: string) =>
      base && href.startsWith("/") ? { href: `${base}${href}`, external: true } : { href, external: false },
    [base],
  )
}
