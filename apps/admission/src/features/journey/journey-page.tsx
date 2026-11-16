"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons, PageHeader, Reveal, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { ScreenSummary } from "../assistant/screen-context"
import { AdmissionShell } from "../shell/components/admission-shell"
import { useJourney } from "./api"
import type { Journey, Milestone } from "./derive"
import { JourneyPath } from "./journey-path"

export function ProgressBar({
  percent,
  label,
  className,
  fillClassName,
}: {
  percent: number
  label: string
  className?: string
  fillClassName?: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          "bg-primary h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
          fillClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function overallPercent(journey: Journey) {
  return journey.total === 0 ? 0 : Math.round((journey.done / journey.total) * 100)
}

function Banner({ journey }: { journey: Journey }) {
  const t = useT("journey")
  const m = journey.current
  return (
    <Reveal>
      <section className="bg-primary text-primary-foreground flex flex-col gap-3 rounded-2xl p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Icons.route aria-hidden className="size-4" />
            {m ? t("here") : t("title")}
          </span>
          <span className="tabular-nums">{t("progress", { done: journey.done, total: journey.total })}</span>
        </div>
        {m ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold md:text-xl">{t(`milestones.${m.key}.title`)}</h2>
              <p className="text-sm opacity-90">{t(`milestones.${m.key}.hint`)}</p>
            </div>
            <Link href={m.href} className={buttonVariants({ variant: "secondary" })}>
              {t("resume")}
              <Icons.arrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        ) : (
          <p className="text-sm">{t("allDone")}</p>
        )}
        <ProgressBar
          percent={overallPercent(journey)}
          label={t("progressLabel")}
          className="bg-primary-foreground/25"
          fillClassName="bg-primary-foreground"
        />
      </section>
    </Reveal>
  )
}

function ActCard({ journey }: { journey: Journey }) {
  const t = useT("journey")
  const act = journey.currentAct
  const n = journey.acts.indexOf(act) + 1
  return (
    <Reveal>
      <section className="bg-card rounded-card flex flex-col gap-4 border p-4 [grid-area:act]">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase">{t("act", { n })}</p>
          <h2 className="text-lg font-semibold leading-tight">{t(`acts.${act.key}.title`)}</h2>
          <p className="text-muted-foreground text-sm">{t(`acts.${act.key}.summary`)}</p>
        </div>
        <p className="text-sm font-medium tabular-nums">
          {t("actProgress", { done: act.doneCount, total: act.milestones.length })}
        </p>
        <ProgressBar
          percent={Math.round((act.doneCount / act.milestones.length) * 100)}
          label={t("actProgress", { done: act.doneCount, total: act.milestones.length })}
        />
        <ol aria-label={t("actsLabel")} className="hidden flex-col gap-1 md:flex">
          {journey.acts.map((a, i) => (
            <li
              key={a.key}
              aria-current={a === act ? "step" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm",
                a === act ? "bg-muted font-medium" : "text-muted-foreground",
              )}
            >
              <span>{t("act", { n: i + 1 })}</span>
              <span className="tabular-nums">
                {a.doneCount}/{a.milestones.length}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Reveal>
  )
}

function NextCard({ milestone }: { milestone: Milestone }) {
  const t = useT("journey")
  const inner = (
    <>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          milestone.state === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {milestone.state === "locked" ? (
          <Icons.lock aria-hidden className="size-4" />
        ) : (
          (() => {
            const G = Icons[milestone.icon]
            return <G aria-hidden className="size-4" />
          })()
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{t(`milestones.${milestone.key}.title`)}</span>
        <span className="text-muted-foreground text-xs">{t(`milestones.${milestone.key}.hint`)}</span>
      </span>
      {milestone.state === "current" ? (
        <span className="text-muted-foreground text-xs tabular-nums">
          {t("percent", { percent: milestone.percent })}
        </span>
      ) : null}
    </>
  )
  const base = "rounded-card flex items-center gap-3 border p-3"
  return milestone.state === "locked" ? (
    <li aria-disabled="true" className={cn(base, "opacity-60")}>
      {inner}
    </li>
  ) : (
    <li>
      <Link href={milestone.href} className={cn(base, "hover:bg-muted/50 min-h-11 transition-colors")}>
        {inner}
      </Link>
    </li>
  )
}

function NextUp({ journey }: { journey: Journey }) {
  const t = useT("journey")
  if (journey.upNext.length === 0) return null
  return (
    <Reveal>
      <section className="flex flex-col gap-3 [grid-area:next]">
        <h2 className="text-base font-semibold">{t("nextUp")}</h2>
        <ul className="flex flex-col gap-2">
          {journey.upNext.map((m) => (
            <NextCard key={m.key} milestone={m} />
          ))}
        </ul>
      </section>
    </Reveal>
  )
}

/** Phone: banner, act card, path, next up. Tablet: act card and next up side by side above the path. Desktop: act card, path, next up. */
export function JourneyView({ journey }: { journey: Journey }) {
  return (
    <div className="flex flex-col gap-4">
      <Banner journey={journey} />
      <div className="grid gap-4 [grid-template-areas:'act''path''next'] md:grid-cols-2 md:items-start md:[grid-template-areas:'act_next''path_path'] xl:grid-cols-[18rem_1fr_20rem] xl:[grid-template-areas:'act_path_next']">
        <ActCard journey={journey} />
        <div className="[grid-area:path]">
          <JourneyPath journey={journey} />
        </div>
        <NextUp journey={journey} />
      </div>
    </div>
  )
}

export function JourneyPage() {
  const t = useT("journey")
  const { journey, pending, error } = useJourney()
  return (
    <AdmissionShell>
      <ScreenSummary
        title={t("title")}
        summary={journey ? `Journey: ${journey.done} of ${journey.total} milestones done.` : "Journey."}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} />
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {t("loadError")}
          </p>
        ) : pending || !journey ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <JourneyView journey={journey} />
        )}
      </div>
    </AdmissionShell>
  )
}
