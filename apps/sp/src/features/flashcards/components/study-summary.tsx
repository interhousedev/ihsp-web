"use client"

import { useT } from "@ihsp/i18n"
import { IconConfetti } from "@tabler/icons-react"
import Link from "next/link"

type StudySummaryProps = { setId: string; reviewed: number }

/** Shown when nothing is due any more (UF-WEB-22 step 7 and alternative 6a). */
export function StudySummary({ setId, reviewed }: StudySummaryProps) {
  const t = useT("flashcards.study.summary")
  const query = `?id=${encodeURIComponent(setId)}`
  return (
    <section
      aria-label={t("title")}
      className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
    >
      <IconConfetti className="text-primary size-10" aria-hidden />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      {reviewed > 0 ? <p className="text-sm">{t("reviewed", { count: reviewed })}</p> : null}
      <p className="text-muted-foreground max-w-sm text-sm">{t("comeBack")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={`/flashcards/set/${query}`}
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium"
        >
          {t("toSet")}
        </Link>
        <Link
          href="/flashcards/"
          className="hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium"
        >
          {t("toList")}
        </Link>
      </div>
    </section>
  )
}
