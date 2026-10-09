"use client"

import { useEffect, useState } from "react"
import type { PinRecord } from "../utils/pin"
import { PIN_CHANGED_EVENT, PIN_STORAGE_PREFIX, readPinRecord } from "../utils/pin-storage"

/** The stored PIN of a user, kept up to date when it is set, changed or removed (here or in another tab). */
export function usePinRecord(userId: string | null): PinRecord | null {
  const [record, setRecord] = useState<PinRecord | null>(() => readPinRecord(userId))

  useEffect(() => {
    const refresh = () => setRecord(readPinRecord(userId))
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(PIN_STORAGE_PREFIX)) refresh()
    }
    refresh()
    window.addEventListener(PIN_CHANGED_EVENT, refresh)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(PIN_CHANGED_EVENT, refresh)
      window.removeEventListener("storage", onStorage)
    }
  }, [userId])

  return record
}
