"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { RoadmapNode } from "../api"

const GUIDED = [
  "countries",
  "major",
  "activities",
  "tests",
  "list",
  "statement",
  "supplements",
  "documents",
  "apply",
  "results",
] as const
type Guided = (typeof GUIDED)[number]
const HOW = ["s1", "s2", "s3"] as const

/**
 * The guide of the home: where the student is on the path, what the current step asks for, how to do it in three
 * moves, and the one button that opens it. It reads the same nodes as the roadmap, so the two never disagree.
 */
export function PathGuide({ nodes, className }: { nodes: RoadmapNode[]; className?: string }) {
  const t = useT("today")
  if (nodes.length === 0) return null
  const total = nodes.length
  const done = nodes.filter((n) => n.state === "done").length
  const index = nodes.findIndex((n) => n.state === "current")
  const current = index >= 0 ? nodes[index] : undefined
  const after = index >= 0 ? nodes[index + 1] : undefined
  const key = current && (GUIDED as readonly string[]).includes(current.key) ? (current.key as Guided) : null

  return (
    <section
      aria-label={t("roadmap.guide.label")}
      className={cn(
        "border-primary/30 bg-primary/5 rounded-card flex min-w-0 flex-col gap-3 border p-3.5 md:gap-4 md:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs font-medium">
          <span className="text-primary tracking-wide uppercase">
            {current ? t("roadmap.guide.step", { n: index + 1, total }) : t("roadmap.guide.finished")}
          </span>
          <span className="text-muted-foreground tabular-nums">{t("roadmap.guide.done", { done, total })}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t("roadmap.guide.done", { done, total })}
          className="bg-primary/15 h-1.5 overflow-hidden rounded-full"
        >
          <div className="bg-primary h-full rounded-full" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      {current && key ? (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl leading-tight font-semibold tracking-tight text-balance md:text-2xl">
              {t(`roadmap.guide.${key}.title`)}
            </h2>
            <p className="text-muted-foreground text-sm">{t(`roadmap.guide.${key}.why`)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-medium">{t("roadmap.guide.how")}</h3>
            <ol className="flex flex-col gap-1.5">
              {HOW.map((step, i) => (
                <li key={step} className="flex items-start gap-2 text-sm">
                  <span className="bg-card text-primary flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <span>{t(`roadmap.guide.${key}.${step}`)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={current.href}
              data-testid="path-guide-cta"
              className={cn(buttonVariants({ size: "lg" }), "max-md:h-11 max-sm:w-full")}
            >
              {t(`roadmap.guide.${key}.cta`)}
              <Icons.arrowRight aria-hidden />
            </Link>
            <span className="text-muted-foreground text-xs">
              {current.progress ? `${t("roadmap.guide.progress", { progress: current.progress })} · ` : ""}
              {after ? t("roadmap.guide.then", { name: t(`roadmap.node.${after.key}`) }) : t("roadmap.guide.last")}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-tight font-semibold tracking-tight md:text-2xl">
            {t("roadmap.guide.allDone.title")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("roadmap.guide.allDone.text")}</p>
        </div>
      )}
    </section>
  )
}
