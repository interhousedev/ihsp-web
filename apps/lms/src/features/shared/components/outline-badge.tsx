"use client"

import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

export type OutlineBadgeKind = NonNullable<NonNullable<OutlineSection["steps"][number]["badge"]>>

const VARIANT = {
  new: "default",
  changed: "secondary",
  removed: "destructive",
  mcp: "outline",
  ai: "outline",
} as const satisfies Record<OutlineBadgeKind, "default" | "secondary" | "destructive" | "outline">

/** "New", "Changed", "Removed" and "Via MCP" and "Via AI" marks of steps (LMS-7, UF-LMS-05). */
export function OutlineBadge({ kind }: { kind: OutlineBadgeKind | null | undefined }) {
  const t = useT("badges")
  if (!kind) return null
  return <Badge variant={VARIANT[kind]}>{t(kind)}</Badge>
}
