"use client"

import { getInitDataRaw } from "@ihsp/telegram"
import { useEffect, useState } from "react"
import { readSession, TELEGRAM_INIT_DATA_KEY, writeSession } from "../utils/storage"

/**
 * Raw Telegram `initData` of this mini app launch. It is also kept in `sessionStorage`, so the registration pages
 * (`/register/`) can hand the user back to `/telegram/` without losing it. `undefined` until the first effect ran.
 */
export function useInitData(): string | null | undefined {
  const [initData, setInitData] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const fresh = getInitDataRaw()
    if (fresh) writeSession(TELEGRAM_INIT_DATA_KEY, fresh)
    setInitData(fresh || readSession(TELEGRAM_INIT_DATA_KEY))
  }, [])

  return initData
}
