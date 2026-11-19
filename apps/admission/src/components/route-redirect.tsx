"use client"

import { Skeleton } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

/** Rewrites the incoming query: returns the new target path (with its own query/hash) and may drop or rename params. */
export type RedirectTarget = (params: URLSearchParams) => { to: string; drop?: string[] }

/**
 * Builds the destination: the target's own query wins, unrelated incoming params and the hash carry over.
 * `drop` lists the incoming params the target replaced (for example `id` -> `item`).
 */
export function redirectUrl(target: ReturnType<RedirectTarget>, incoming: URLSearchParams, hash: string): string {
  const [pathAndQuery, ownHash = ""] = target.to.split("#")
  const [path, ownQuery = ""] = pathAndQuery.split("?")
  const next = new URLSearchParams(ownQuery)
  const dropped = new Set(target.drop ?? [])
  incoming.forEach((value, key) => {
    if (!dropped.has(key) && !next.has(key)) next.append(key, value)
  })
  const query = next.toString()
  const fragment = ownHash || hash.replace(/^#/, "")
  return `${path}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`
}

function Redirect({ target }: { target: RedirectTarget }) {
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    router.replace(redirectUrl(target(params), params, window.location.hash))
  }, [router, params, target])
  return <Skeleton className="m-6 h-24" />
}

/** An old route: a client-side replace to its new home (a static export has no server redirects). */
export function RouteRedirect({ target }: { target: RedirectTarget }) {
  return (
    <Suspense>
      <Redirect target={target} />
    </Suspense>
  )
}
