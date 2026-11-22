"use client"

import { useT } from "@ihsp/i18n"
import type { Institution } from "../types"

/** Overall chip (e.g. "QS #5 · 2026") and the subject rankings of an institution, each linked to its source. */
export function InstitutionRankings({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const tExtras = useT("discover")
  const rankings = institution.rankings ?? []
  if (!rankings.length) return null
  const subject = (slug: string) =>
    tExtras.has(`extras.subjects.${slug}`) ? tExtras(`extras.subjects.${slug}`) : slug.replaceAll("_", " ")
  return (
    <section aria-label={t("detail.rankingsTitle")} className="flex flex-wrap items-center gap-2">
      {rankings.map((r) => (
        <a
          key={`${r.system}-${r.subject}`}
          href={r.source_url}
          target="_blank"
          rel="noopener noreferrer"
          title={t("detail.rankingSource", { system: r.system.toUpperCase() })}
          className="bg-card rounded-full border px-3 py-1 text-sm font-medium hover:underline"
        >
          {r.subject === "overall"
            ? `${r.system.toUpperCase()} #${r.rank} · ${r.year}`
            : `${r.system.toUpperCase()} ${subject(r.subject)} #${r.rank} · ${r.year}`}
        </a>
      ))}
    </section>
  )
}
