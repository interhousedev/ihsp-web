"use client"

import { useEffect, useState } from "react"

const BASE_PATH = "ai"
/** The static page behind the rewrite; it is not a slug. */
const RESERVED = new Set(["view"])

/** The slug of `/ai/<slug>/` from a pathname, or null when the path has none. */
export function slugFromPathname(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean)
  const rest = parts[0] === BASE_PATH ? parts.slice(1) : parts
  const slug = rest[0]
  if (!slug || rest.length > 1 || RESERVED.has(slug)) return null
  try {
    return decodeURIComponent(slug)
  } catch {
    // Malformed percent-encoding (`/ai/%E0%A4%A`) is "Link not found", not a blank page.
    return null
  }
}

/**
 * The share slug, read from `location.pathname` after the first render (the page is static and nginx serves it for any
 * `/ai/*` path). `undefined` until the path is read, `null` when the path has no slug.
 */
export function useShareSlug(): string | null | undefined {
  const [slug, setSlug] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    setSlug(slugFromPathname(window.location.pathname))
  }, [])
  return slug
}
