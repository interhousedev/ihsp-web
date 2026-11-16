"use client"

import { useT } from "@ihsp/i18n"

type Loose = { (key: string): string; has: (key: string) => boolean }

/** Label of a backend option value (`chooser.options.<group>.<value>`); an unknown value shows as the backend sent it. */
export function useOptionLabel(group: string): (value: string) => string {
  const t = useT("chooser") as unknown as Loose
  return (value) => {
    const key = `options.${group}.${value}`
    return t.has(key) ? t(key) : value
  }
}
