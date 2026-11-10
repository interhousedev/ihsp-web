"use client"

import { useT } from "@ihsp/i18n"

/** next-intl types keys from one message file; the id app builds some keys at run time, so it uses this loose view. */
export type Translate = {
  (key: string, values?: Record<string, string | number>): string
  has: (key: string) => boolean
}

export function useTr(): Translate {
  return useT() as unknown as Translate
}
