"use client"

import { useSearchParams } from "next/navigation"

/** A non-empty query parameter (`login_challenge`, `token`), or `null`. Callers sit inside a `<Suspense>` boundary. */
export function useQueryParam(name: string): string | null {
  const params = useSearchParams()
  const value = params.get(name)
  return value ? value : null
}
