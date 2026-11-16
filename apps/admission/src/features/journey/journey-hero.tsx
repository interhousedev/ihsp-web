"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Card, CardContent, Icons, Reveal, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useJourney } from "./api"
import { ProgressBar } from "./journey-page"

/** Compact journey card for the home dashboard: the current act, overall progress and a way back in. */
export function JourneyHero() {
  const t = useT("journey")
  const { journey, pending, error } = useJourney()
  if (error) return null
  return (
    <Reveal>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {pending || !journey ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <Icons.route aria-hidden className="size-4" />
                  {t("act", { n: journey.acts.indexOf(journey.currentAct) + 1 })}
                </div>
                <h2 className="text-base font-semibold leading-tight">{t(`acts.${journey.currentAct.key}.title`)}</h2>
                <ProgressBar
                  percent={journey.total === 0 ? 0 : Math.round((journey.done / journey.total) * 100)}
                  label={t("progressLabel")}
                />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {t("progress", { done: journey.done, total: journey.total })}
                </p>
              </div>
              <Link href={journey.current?.href ?? "/journey/"} className={buttonVariants()}>
                {t("resume")}
                <Icons.arrowRight aria-hidden className="size-4" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </Reveal>
  )
}
