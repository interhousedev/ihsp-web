"use client"

import { useT } from "@ihsp/i18n"
import { CopyButton } from "@ihsp/ui"
import { itemHref } from "../utils/hrefs"

/**
 * Copies the link to share: the public server-rendered page `/b/{slug}` when the item has a slug (link previews work
 * there), else the item page of the app. Nothing for an unstored UniLibrary record.
 */
export function ShareLink({ id, slug }: { id: string | null; slug: string | null }) {
  const t = useT("library.item")
  if (!id && !slug) return null
  const origin = typeof window === "undefined" ? "" : window.location.origin
  const value = slug ? `${origin}/b/${encodeURIComponent(slug)}` : `${origin}${itemHref(id!)}`
  return <CopyButton value={value} label={t("share")} />
}
