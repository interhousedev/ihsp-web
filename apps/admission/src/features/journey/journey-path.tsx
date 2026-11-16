"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { CSSProperties } from "react"
import type { Journey, Milestone } from "./derive"

const ROW = 128
/** Tile centre (percent of the width) of the i-th milestone: a column below xl, a zigzag from xl up. */
const X = {
  phone: [14],
  desktop: [30, 50, 70, 50],
} as const

const at = (xs: readonly number[], i: number) => xs[i % xs.length]

function pathD(xs: readonly number[], upTo: number): string {
  let d = `M ${at(xs, 0)} ${ROW / 2}`
  for (let i = 1; i <= upTo; i++) {
    const y = i * ROW + ROW / 2
    d += ` C ${at(xs, i - 1)} ${y - ROW / 2}, ${at(xs, i)} ${y - ROW / 2}, ${at(xs, i)} ${y}`
  }
  return d
}

function Trail({
  xs,
  count,
  reached,
  className,
}: {
  xs: readonly number[]
  count: number
  reached: number
  className: string
}) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
      viewBox={`0 0 100 ${count * ROW}`}
      preserveAspectRatio="none"
    >
      <path
        d={pathD(xs, count - 1)}
        fill="none"
        strokeWidth={4}
        strokeDasharray="1 9"
        strokeLinecap="round"
        className="stroke-border"
        vectorEffect="non-scaling-stroke"
      />
      {reached > 0 ? (
        <>
          <path
            d={pathD(xs, reached)}
            fill="none"
            strokeWidth={14}
            strokeLinecap="round"
            className="stroke-primary/25 blur-sm"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={pathD(xs, reached)}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            className="stroke-primary"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  )
}

const TILE = {
  done: "bg-primary text-primary-foreground shadow-[0_0_24px] shadow-primary/40",
  current:
    "bg-background text-primary border-2 border-primary shadow-[0_0_32px] shadow-primary/60 motion-safe:animate-pulse",
  locked: "bg-muted text-muted-foreground",
} as const

function Tile({ milestone }: { milestone: Milestone }) {
  const t = useT("journey")
  const Glyph =
    milestone.state === "locked" ? Icons.lock : milestone.state === "done" ? Icons.check : Icons[milestone.icon]
  const side = (i: number, xs: readonly number[]) => (at(xs, i) > 50 ? "left" : "right")
  const i = milestone.index
  const place = cn(
    "absolute top-1/2 w-40 -translate-y-1/2 sm:w-52 xl:w-40",
    side(i, X.phone) === "right" ? "left-full ml-5" : "right-full mr-5 text-right",
    side(i, X.desktop) === "right"
      ? "xl:left-full xl:right-auto xl:ml-5 xl:mr-0 xl:text-left"
      : "xl:right-full xl:left-auto xl:mr-5 xl:ml-0 xl:text-right",
  )
  const body = (
    <>
      <span
        className={cn(
          "grid size-14 rotate-45 place-items-center rounded-xl transition-transform motion-reduce:transition-none",
          TILE[milestone.state],
        )}
      >
        <Glyph aria-hidden className="size-6 -rotate-45" />
      </span>
      <span className={cn("pointer-events-none", place)}>
        <span className="block text-sm font-semibold leading-tight">{t(`milestones.${milestone.key}.title`)}</span>
        <span className="text-muted-foreground block text-xs">{t(`state.${milestone.state}`)}</span>
      </span>
    </>
  )
  const vars = {
    "--xp": `${at(X.phone, i)}%`,
    "--xd": `${at(X.desktop, i)}%`,
    top: `${i * ROW + ROW / 2}px`,
  } as CSSProperties
  const frame =
    "absolute left-[var(--xp)] xl:left-[var(--xd)] -translate-x-1/2 -translate-y-1/2 flex size-14 items-center justify-center"
  return milestone.state === "locked" ? (
    <div aria-disabled="true" data-state="locked" data-milestone={milestone.key} className={frame} style={vars}>
      {body}
    </div>
  ) : (
    <Link
      href={milestone.href}
      data-state={milestone.state}
      data-milestone={milestone.key}
      className={cn(frame, "focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2")}
      style={vars}
    >
      {body}
    </Link>
  )
}

/** The glowing path: every milestone as a diamond tile joined by a trail that is lit up to the current one. */
export function JourneyPath({ journey }: { journey: Journey }) {
  const t = useT("journey")
  const all = journey.acts.flatMap((act) => act.milestones)
  const reached = journey.current ? journey.current.index : all.length - 1
  return (
    <div
      role="group"
      aria-label={t("pathLabel")}
      className="relative mx-auto w-full max-w-md xl:max-w-xl"
      style={{ height: all.length * ROW }}
    >
      <Trail xs={X.phone} count={all.length} reached={reached} className="xl:hidden" />
      <Trail xs={X.desktop} count={all.length} reached={reached} className="hidden xl:block" />
      {all.map((m) => (
        <Tile key={m.key} milestone={m} />
      ))}
    </div>
  )
}
