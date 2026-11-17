"use client"

import { pageClass } from "../../../components/lib/page"
import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { pick, type CareerMajor, type CareerPlan } from "../api"
import type { Recommendation } from "../quiz"

/** The recommended majors: cards with a reason, "Add to profile", the explanation, redo and the colleges banner. */
export function CareerResults({
  recommendations,
  majors,
  plan,
  busy,
  onAdd,
  onRedo,
}: {
  recommendations: readonly Recommendation[]
  majors: readonly CareerMajor[]
  plan: CareerPlan
  busy: boolean
  onAdd: (code: string) => void
  onRedo: () => void
}) {
  const t = useT("career")
  const locale = useLocale()
  const [why, setWhy] = useState(false)
  const [banner, setBanner] = useState(true)
  const name = (code: string) => {
    const major = majors.find((m) => m.code === code)
    return major ? pick(major.name, locale) : code
  }
  // Answers that voted for fewer of the shown majors say more about this one: cite those first.
  const shared = (answer: readonly [string, string]) =>
    recommendations.filter((r) => r.because.some(([q, o]) => q === answer[0] && o === answer[1])).length
  const picks = (r: Recommendation) =>
    [...r.because]
      .sort((x, y) => shared(x) - shared(y))
      .slice(0, 2)
      .map(([question, option]) => t(`quiz.${question}.${option}`))
      .join("; ")
  return (
    <div className={pageClass("narrow")}>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">{t("resultsTitle")}</h1>
        <p className="text-muted-foreground">{t("resultsText")}</p>
      </header>
      {recommendations.length === 0 && plan.majors.length > 0 ? null : recommendations.length === 0 ? (
        <p className="rounded-card border p-4">{t("noResults")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {recommendations.map((r) => {
            const added = plan.majors.includes(r.code)
            return (
              <li key={r.code} className="bg-card rounded-card flex flex-col gap-3 border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{name(r.code)}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-11 md:min-h-9"
                    disabled={busy || added}
                    aria-label={t(added ? "added" : "add", { major: name(r.code) })}
                    onClick={() => onAdd(r.code)}
                  >
                    {added ? <Icons.check aria-hidden /> : null}
                    {t(added ? "added" : "add")}
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">{t("reason", { major: name(r.code), picks: picks(r) })}</p>
              </li>
            )
          })}
        </ul>
      )}
      {plan.majors.length > 0 && (
        <p className="text-sm" data-testid="profile-majors">
          {t("onProfile", { majors: plan.majors.map(name).join(", ") })}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="outline" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
          {t("why")}
        </Button>
        <Button variant="outline" disabled={busy} onClick={onRedo}>
          {t("redo")}
        </Button>
      </div>
      {why && (
        <section className="bg-card rounded-card space-y-3 border p-4" aria-label={t("why")}>
          <p>{t("whyIntro")}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {recommendations.map((r) => (
              <li key={r.code}>
                <strong>{name(r.code)}</strong>: {picks(r)}
              </li>
            ))}
          </ul>
        </section>
      )}
      {banner && (
        <aside className="bg-accent rounded-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{t("bannerTitle")}</p>
          <div className="flex items-center gap-2">
            <Link href="/colleges/discover" className="inline-flex min-h-11 items-center gap-2 font-medium underline">
              {t("bannerLink")}
              <Icons.arrowRight aria-hidden className="size-4" />
            </Link>
            <Button variant="ghost" size="sm" aria-label={t("dismiss")} onClick={() => setBanner(false)}>
              <Icons.close aria-hidden />
            </Button>
          </div>
        </aside>
      )}
    </div>
  )
}
