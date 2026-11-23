"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { pick, type EdgeIo, type NodeKind, type NodeStatus, type StageIn } from "../api"

type RoadNode = { id: string; title: StageIn["title"]; kind: NodeKind; level: string; optional: boolean }
type RoadStage = { id: string; title: StageIn["title"]; nodes: RoadNode[] }
type Path = { key: string; d: string; done: boolean }

export const STATUS_CLASS: Record<NodeStatus | "none", string> = {
  none: "bg-card border-border",
  in_progress: "border-warning bg-warning-muted",
  done: "border-success bg-success-muted",
  skipped: "border-border bg-muted text-muted-foreground",
}

/**
 * A roadmap.sh-like view: one lane per stage, top to bottom, node cards coloured by status and SVG curves
 * from every prerequisite to the step it opens. Used by the student page and the editor preview.
 */
export function Roadmap({
  stages,
  edges,
  progress,
  selected,
  onSelect,
}: {
  stages: RoadStage[]
  edges: EdgeIo[]
  progress: Record<string, NodeStatus>
  selected?: string | null
  onSelect?: (id: string) => void
}) {
  const t = useT("trajectories")
  const lang = useLocale()
  const box = useRef<HTMLDivElement>(null)
  const cards = useRef(new Map<string, HTMLElement>())
  const [paths, setPaths] = useState<Path[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const root = box.current
    if (!root) return
    const r = root.getBoundingClientRect()
    const next: Path[] = []
    for (const e of edges) {
      const a = cards.current.get(e.before)?.getBoundingClientRect()
      const b = cards.current.get(e.after)?.getBoundingClientRect()
      if (!a || !b) continue
      const sameRow = Math.abs(a.top - b.top) < 4
      const x1 = sameRow ? (a.left < b.left ? a.right : a.left) - r.left : a.left + a.width / 2 - r.left
      const y1 = sameRow ? a.top + a.height / 2 - r.top : a.bottom - r.top
      const x2 = sameRow ? (a.left < b.left ? b.left : b.right) - r.left : b.left + b.width / 2 - r.left
      const y2 = sameRow ? b.top + b.height / 2 - r.top : b.top - r.top
      const bend = Math.max(24, Math.abs(y2 - y1) / 2)
      const d = sameRow
        ? `M${x1},${y1} L${x2},${y2}`
        : `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`
      next.push({ key: `${e.before}>${e.after}`, d, done: progress[e.before] === "done" })
    }
    setPaths(next)
    setSize({ w: r.width, h: r.height })
  }, [edges, progress])

  useLayoutEffect(() => {
    measure()
    const root = box.current
    if (!root || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(root)
    return () => observer.disconnect()
  }, [measure, stages])

  return (
    <div ref={box} className="relative flex flex-col gap-10 py-2">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      >
        <defs>
          <marker id="traj-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-muted-foreground" />
          </marker>
        </defs>
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            strokeWidth={2}
            markerEnd="url(#traj-arrow)"
            strokeDasharray={p.done ? undefined : "5 4"}
            className={p.done ? "stroke-success" : "stroke-muted-foreground/60"}
          />
        ))}
      </svg>
      {stages.map((stage, i) => (
        <section key={stage.id} aria-labelledby={`lane-${stage.id}`} className="relative flex flex-col gap-3">
          <h2 id={`lane-${stage.id}`} className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs">
              {i + 1}
            </span>
            {pick(stage.title, lang)}
          </h2>
          {stage.nodes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("emptyStage")}</p>
          ) : (
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-8">
              {stage.nodes.map((node) => {
                const status = (progress[node.id] as NodeStatus | undefined) ?? "none"
                return (
                  <li
                    key={node.id}
                    ref={(el) => {
                      if (el) cards.current.set(node.id, el)
                      else cards.current.delete(node.id)
                    }}
                    className="w-full sm:w-56"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect?.(node.id)}
                      aria-pressed={selected === node.id}
                      className={cn(
                        "relative z-10 flex min-h-16 w-full flex-col gap-1 rounded-card border-2 p-3 text-left shadow-sm transition hover:shadow-md",
                        STATUS_CLASS[status],
                        node.optional && "border-dashed",
                        selected === node.id && "ring-primary ring-2 ring-offset-2",
                      )}
                    >
                      <span className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                        <span>{t(`kind.${node.kind}`)}</span>
                        <span>{node.optional ? t("optional") : t(`level.${node.level}`)}</span>
                      </span>
                      <span className={cn("font-medium", status === "skipped" && "line-through")}>
                        {pick(node.title, lang)}
                      </span>
                      {status !== "none" && <span className="text-xs font-medium">{t(`status.${status}`)}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

/** The colour key under a roadmap. */
export function RoadmapLegend() {
  const t = useT("trajectories")
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-3 text-xs">
      {(["none", "in_progress", "done", "skipped"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm border-2", STATUS_CLASS[s])} />
          {t(`status.${s}`)}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border-2 border-dashed" />
        {t("optional")}
      </li>
    </ul>
  )
}
