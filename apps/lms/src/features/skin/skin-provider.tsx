"use client"

import { useSession } from "@ihsp/auth"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { applySkin, readStoredSkin, type Skin } from "./skin"

type SkinContextValue = {
  /** `null` until the user picks a skin (on this device and in the account). */
  skin: Skin | null
  setSkin: (skin: Skin) => void
}

const SkinContext = createContext<SkinContextValue | null>(null)

/**
 * Keeps `<html data-skin>`, localStorage and `preferences.lms_skin` in step. When the account has a choice it wins
 * (a login on a new device follows the account); a choice made on this device before the account had one is saved
 * to the account once the session is there.
 */
export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setLocal] = useState<Skin | null>(() => (typeof window === "undefined" ? null : readStoredSkin()))
  const { status } = useSession()
  const preferences = usePreferences()
  const { mutate } = useUpdatePreferences()
  const account = preferences?.lms_skin ?? null
  const loaded = status === "authenticated" && preferences !== null

  useEffect(() => {
    if (!loaded) return
    if (account !== null) {
      if (account !== skin) {
        applySkin(account)
        setLocal(account)
      }
    } else if (skin !== null) {
      mutate({ lms_skin: skin })
    }
    // Only the account value and the session drive this sync; local changes go through `setSkin`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, account])

  const setSkin = useCallback(
    (next: Skin) => {
      applySkin(next)
      setLocal(next)
      if (loaded && account !== next) mutate({ lms_skin: next })
    },
    [loaded, account, mutate],
  )

  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin])
  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>
}

export function useSkin(): SkinContextValue {
  const value = useContext(SkinContext)
  if (!value) throw new Error("useSkin must be used inside SkinProvider")
  return value
}
