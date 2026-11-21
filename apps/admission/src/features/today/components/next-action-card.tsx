"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useSnoozeAction, type TodayAction } from "../api"

const KINDS = ["task", "essay", "opportunity"]

/**
 * The one feed of "what to do now": a big top item and at most two queued ones, each with a "why" line and a time
 * estimate. "Не сейчас" only hides the top item locally (and asks the server to snooze it: 3 days, twice at most for dated items).
 */
export function NextActionCard({
  actions,
  snoozed,
  onSnooze,
  className,
}: {
  actions: TodayAction[]
  snoozed: string[]
  onSnooze: (key: string) => void
  className?: string
}) {
  const t = useT("today")
  const snooze = useSnoozeAction()
  const queue = actions.filter((action) => !snoozed.includes(action.key)).slice(0, 3)
  const [top, ...rest] = queue
  if (!top) return null
  return (
    <section
      aria-label={t("next.title")}
      className={cn("bg-card rounded-card flex min-w-0 flex-col overflow-hidden border", className)}
    >
      <div className="flex flex-col gap-2.5 p-3.5 md:gap-3 md:p-5">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wide uppercase">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
              1
            </span>
            {t("next.title")}
          </span>
          <span className="flex items-center gap-1 normal-case tabular-nums">
            <Icons.clock aria-hidden className="size-3.5" />
            {t("next.min", { n: top.minutes })}
          </span>
        </div>
        <h2 className="text-lg leading-tight font-semibold tracking-tight text-balance md:text-2xl">
          {top.title}
        </h2>
        <p className="text-muted-foreground flex items-start gap-2 text-sm leading-snug">
          <Icons.info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="text-foreground font-medium">{t("next.why")}: </span>
            {top.why}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={top.href} className={cn(buttonVariants({ size: "lg" }), "max-md:h-10 max-sm:flex-1")}>
            {t(`next.action.${KINDS.includes(top.kind ?? "") ? top.kind : "task"}`)}
            <Icons.arrowRight aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => {
              onSnooze(top.key)
              snooze.mutate(top.key)
            }}
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "max-md:h-10")}
          >
            {t("next.later")}
          </button>
        </div>
      </div>
      {rest.length > 0 ? (
        <ol className="divide-y border-t max-lg:hidden" aria-label={t("next.queued")}>
          {rest.map((action, index) => (
            <li key={action.key}>
              <Link
                href={action.href}
                className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center gap-3 px-3.5 py-1.5 md:min-h-14 md:py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset md:px-5"
              >
                <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                  {index + 2}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{action.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {action.why}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{t("next.min", { n: action.minutes })}</span>
                <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}

/** The queued items on their own, for the phone order (next action, universities, then these). */
export function QueuedActions({ actions, snoozed, className }: { actions: TodayAction[]; snoozed: string[]; className?: string }) {
  const t = useT("today")
  const rest = actions.filter((a) => !snoozed.includes(a.key)).slice(1, 3)
  if (rest.length === 0) return null
  return (
    <ol aria-label={t("next.queued")} className={cn("bg-card rounded-card divide-y overflow-hidden border", className)}>
      {rest.map((action, index) => (
        <li key={action.key}>
          <Link href={action.href} className="hover:bg-muted/50 flex min-h-12 items-center gap-3 px-3.5 py-1.5">
            <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
              {index + 2}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{action.title}</span>
              <span className="text-muted-foreground block truncate text-xs">{action.why}</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{t("next.min", { n: action.minutes })}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
