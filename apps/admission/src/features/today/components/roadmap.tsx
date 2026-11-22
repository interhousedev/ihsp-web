"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import type { RoadmapNode } from "../api"

const ICONS = {
  countries: Icons.globe,
  major: Icons.search,
  activities: Icons.sparkles,
  tests: Icons.exams,
  list: Icons.kanban,
  statement: Icons.post,
  supplements: Icons.edit,
  documents: Icons.files,
  apply: Icons.send,
  results: Icons.flag,
} as const

const XP_PER_DAY = 10
const XP_PER_NODE = 50

/**
 * A Duolingo-like path: one vertical lane of round nodes, finished ones filled, the current one ringed, the rest greyed.
 * Each node opens its page. The streak and finished nodes make the XP.
 */
export function Roadmap({
  nodes,
  streakDays,
  className,
}: {
  nodes: RoadmapNode[]
  streakDays: number
  className?: string
}) {
  const t = useT("today")
  if (nodes.length === 0) return null
  const done = nodes.filter((n) => n.state === "done").length
  const xp = streakDays * XP_PER_DAY + done * XP_PER_NODE
  return (
    <section
      aria-label={t("roadmap.title")}
      className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3.5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("roadmap.title")}</h2>
        <Pill tone="primary">{t("roadmap.xp", { xp })}</Pill>
      </div>
      <ol className="flex flex-col lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto">
        {nodes.map((node, i) => {
          const Icon =
            node.state === "locked"
              ? Icons.lock
              : node.state === "done"
                ? Icons.check
                : (ICONS[node.key as keyof typeof ICONS] ?? Icons.sparkles)
          const name = t(`roadmap.node.${node.key}`)
          return (
            <li
              key={node.key}
              className="flex min-w-0 gap-3"
              aria-current={node.state === "current" ? "step" : undefined}
            >
              <div className="flex flex-col items-center">
                <Link
                  href={node.href}
                  aria-label={t("roadmap.open", { name })}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border-2",
                    node.state === "done" && "bg-primary text-primary-foreground border-primary",
                    node.state === "current" && "border-primary text-primary ring-primary/30 bg-card ring-4",
                    node.state === "locked" && "bg-muted text-muted-foreground border-transparent",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </Link>
                {i < nodes.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn("my-0.5 h-3 w-0.5 rounded-full", node.state === "done" ? "bg-primary" : "bg-border")}
                  />
                ) : null}
              </div>
              <div className="flex min-h-11 min-w-0 flex-col justify-center pb-3">
                <span
                  className={cn("truncate text-sm font-medium", node.state === "locked" && "text-muted-foreground")}
                >
                  {name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {node.state === "current" && node.progress
                    ? `${t("roadmap.state.current")} · ${node.progress}`
                    : t(`roadmap.state.${node.state}`)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
