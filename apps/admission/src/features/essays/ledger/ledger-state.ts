"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { PromptScope } from "../flow/api"
import { legacyTarget } from "./ledger-model"

export type Lens = "essay" | "uni"
export type Drawer = "ideas" | "examples"
const DRAWERS: readonly string[] = ["ideas", "examples"]

/**
 * What the ledger shows, kept in the address so a view can be shared and the back button works: my list or all
 * prompts, by essay or by university, the open drawer and the open prompt group. The old `?step=` and `?tab=` links
 * of the six-step flow land on the matching lens or drawer; practice has its own page now.
 */
export function useLedgerView() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const legacy = legacyTarget(params.get("step"), params.get("tab"))
  const scope: PromptScope = params.get("scope") === "all" ? "all" : "list"
  const lens: Lens = (params.get("lens") ?? legacy?.lens) === "uni" ? "uni" : "essay"
  const rawDrawer = params.get("drawer") ?? legacy?.drawer ?? null
  const drawer = rawDrawer && DRAWERS.includes(rawDrawer) ? (rawDrawer as Drawer) : null
  const group = params.get("group")
  const uni = params.get("uni")
  const set = useCallback(
    (patch: Partial<Record<"scope" | "lens" | "drawer" | "group" | "uni", string | null>>) => {
      const next = new URLSearchParams(params.toString())
      next.delete("step")
      next.delete("tab")
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )
  const practiceLink = params.get("step") === "practice" || params.get("tab") === "practice" || params.get("drawer") === "practice"
  return { scope, lens, drawer, group, uni, practiceLink, set }
}

const COLLAPSED_KEY = "ihsp.essays.collapsed"

/** The ledger sections the student folded, remembered in this browser. */
export function useCollapsed() {
  const [collapsed, setCollapsed] = useState<string[]>([])
  useEffect(() => {
    try {
      setCollapsed(JSON.parse(window.localStorage.getItem(COLLAPSED_KEY) ?? "[]") as string[])
    } catch {
      setCollapsed([])
    }
  }, [])
  const toggle = useCallback((type: string) => {
    setCollapsed((prev) => {
      const next = prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
      try {
        window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
      } catch {
        /* a full or blocked store only loses the memory */
      }
      return next
    })
  }, [])
  return { collapsed, toggle }
}
