"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Card, CardContent, Icons, Reveal, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect } from "react"
import { careerPlanQuery } from "../../career/api"
import { useList } from "../../chooser/hooks"
import { useItems } from "../../items/api"
import { useJourney } from "../../journey/api"
import { JourneyView } from "../../journey/journey-page"
import { useReadiness } from "../../readiness/api"

type SectionKey = "career" | "activities" | "universities" | "essays" | "apply"

/** The five student sections in sidebar order, each with its landing page. */
export const SECTIONS = [
  { key: "career", href: "/career/", icon: Icons.sparkles },
  { key: "activities", href: "/activities/", icon: Icons.exams },
  { key: "universities", href: "/chooser/", icon: Icons.globe },
  { key: "essays", href: "/essays/", icon: Icons.text },
  { key: "apply", href: "/documents/", icon: Icons.checks },
] as const satisfies readonly { key: SectionKey; href: string; icon: unknown }[]

function useStatuses(): Record<SectionKey, string | null> {
  const t = useT("home.sections")
  const career = useQuery(careerPlanQuery())
  const items = useItems()
  const list = useList()
  const readiness = useReadiness()
  const score = (key: string) => readiness.data?.components.find((c) => c.key === key)?.score
  const essays = score("essays")
  const documents = score("documents")
  const field = career.data?.study_focus.labels[0]
  return {
    career: career.isPending ? null : field ? t("status.careerField", { field }) : t("status.careerNone"),
    activities: items.data ? t("status.activities", { count: items.data.length }) : null,
    universities: list.data ? t("status.universities", { count: list.data.length }) : null,
    essays: essays === undefined ? null : t("status.percent", { percent: essays }),
    apply: documents === undefined ? null : t("status.percent", { percent: documents }),
  }
}

/** Five cards, one per section, each with a short status and a link to the section's landing page. */
export function SectionCards() {
  const t = useT("home.sections")
  const statuses = useStatuses()
  return (
    <nav aria-label={t("label")}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {SECTIONS.map(({ key, href, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className="bg-card border-hairline-strong rounded-card hover:border-primary/40 flex h-full min-h-11 items-start gap-3 border p-4 shadow-sm xl:items-center xl:p-3"
            >
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold break-words hyphens-auto">{t(`${key}.title`)}</span>
                <span className="text-muted-foreground text-xs break-words">
                  {statuses[key] ?? t("status.loading")}
                </span>
              </span>
              <span className="mt-1 flex w-6 shrink-0 justify-end xl:hidden">
                <Icons.arrowRight aria-hidden className="text-muted-foreground size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The one primary action: the first readiness component that still has a next action. */
export function ContinueAction() {
  const t = useT("home.sections")
  const tActions = useT("home.readiness")
  const readiness = useReadiness()
  if (readiness.isError) return null
  const next = readiness.data?.components.find((c) => c.next_action && c.url_path)
  return (
    <Reveal>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {readiness.isPending ? (
            <Skeleton className="h-12 w-full" />
          ) : next?.next_action && next.url_path ? (
            <>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-base font-semibold">{t("continue.title")}</h2>
                <p className="text-muted-foreground text-sm">{tActions(`actions.${next.next_action}`)}</p>
              </div>
              <Link href={next.url_path} className={buttonVariants()}>
                {t("continue.cta")}
                <Icons.arrowRight aria-hidden className="size-4" />
              </Link>
            </>
          ) : (
            <p className="text-sm">{t("continue.allDone")}</p>
          )}
        </CardContent>
      </Card>
    </Reveal>
  )
}

/** The journey steps (the former /journey/ page); `/#journey` scrolls here. */
export function JourneySection() {
  const t = useT("journey")
  const { journey, pending, error } = useJourney()
  const ready = Boolean(journey)
  useEffect(() => {
    const show = () => {
      if (window.location.hash === "#journey") document.getElementById("journey")?.scrollIntoView?.()
    }
    show()
    window.addEventListener("hashchange", show)
    return () => window.removeEventListener("hashchange", show)
  }, [ready])
  return (
    <section id="journey" aria-labelledby="journey-title" className="scroll-mt-16 flex flex-col gap-3">
      <h2 id="journey-title" className="flex items-center gap-2 text-lg font-semibold">
        <Icons.route aria-hidden className="text-primary size-5" />
        {t("title")}
      </h2>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {t("loadError")}
        </p>
      ) : pending || !journey ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <JourneyView journey={journey} />
      )}
    </section>
  )
}
