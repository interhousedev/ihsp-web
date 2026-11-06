"use client"

import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { AiMark, Badge } from "@ihsp/ui"

export type OutlineBadgeKind = NonNullable<NonNullable<OutlineSection["steps"][number]["badge"]>>

const VARIANT = {
  new: "default",
  changed: "secondary",
  removed: "destructive",
  mcp: "outline",
  ai: "outline",
} as const satisfies Record<OutlineBadgeKind, "default" | "secondary" | "destructive" | "outline">

/** "New", "Changed", "Removed" and "Via AI" marks of steps, and the AI icon of MCP edits (LMS-7, UF-LMS-05). */
export function OutlineBadge({ kind }: { kind: OutlineBadgeKind | null | undefined }) {
  const t = useT("badges")
  if (!kind) return null
  if (kind === "mcp") return <AiMark label={t("mcp")} />
  return <Badge variant={VARIANT[kind]}>{t(kind)}</Badge>
}
