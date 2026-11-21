"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { goalsFitQuery } from "../api"

/** Step 4: what the picks do to the "goals" axis of the university fit, with the way to the list. */
export function FitImpact({ picks }: { picks: number }) {
  const t = useT("professions")
  const fit = useQuery({ ...goalsFitQuery(), retry: false })
  const scores = (fit.data?.items ?? [])
    .map((item) => item.axes.find((axis) => axis.key === "goals")?.score)
    .filter((score): score is number => typeof score === "number")
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  return (
    <div className="bg-card rounded-card flex flex-col gap-3 border p-4 md:flex-row md:items-center md:gap-6">
      <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold tabular-nums">
        {average ?? <Icons.minus aria-hidden className="size-5" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-semibold">{t("impact.title")}</p>
        <p className="text-muted-foreground text-sm">
          {picks === 0
            ? t("impact.noPicks")
            : average === null
              ? t("impact.noList", { count: picks })
              : t("impact.avg", { value: average, count: scores.length })}
        </p>
      </div>
      <Link
        href="/chooser/"
        className="text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1.5 text-sm font-medium outline-none hover:underline focus-visible:ring-2"
      >
        {t("impact.link")}
        <Icons.arrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  )
}
