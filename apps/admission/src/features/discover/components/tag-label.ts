"use client"

import { useT } from "@ihsp/i18n"

type Loose = { (key: string): string; has: (key: string) => boolean }

/** Label of a preference tag (`prefs.tags.<key with ":" as "_">`); an unknown tag shows as it came. */
export function useTagLabel(): (tag: string) => string {
  const t = useT("prefs") as unknown as Loose
  return (tag) => {
    const key = `tags.${tag.replace(/:/g, "_")}`
    return t.has(key) ? t(key) : tag
  }
}
