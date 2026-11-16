"use client"

import { useLocale, useT } from "@ihsp/i18n"

type Loose = { (key: string): string; has: (key: string) => boolean }

/** Label of a backend option value (`chooser.options.<group>.<value>`); an unknown value shows as the backend sent it. */
export function useOptionLabel(group: string): (value: string) => string {
  const t = useT("chooser") as unknown as Loose
  const locale = useLocale()
  const countries = new Intl.DisplayNames([locale], { type: "region" })
  return (value) => {
    if (group === "country" && /^[a-z]{2}$/i.test(value)) return countries.of(value.toUpperCase()) ?? value
    const exact = `options.${group}.${value}`
    const key = `options.${group}.${value.toLowerCase()}`
    return t.has(exact) ? t(exact) : t.has(key) ? t(key) : value
  }
}
