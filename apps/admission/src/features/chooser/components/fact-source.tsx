"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Icons } from "@ihsp/ui"
import type { Fact, Source } from "../types"

/** Facts older than a year are marked as possibly out of date. */
export function isStale(year: number | null, now = new Date().getFullYear()): boolean {
  return year !== null && now - year > 1
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const t = useT("chooser")
  return verified ? (
    <Badge variant="success">
      <Icons.badgeCheck aria-hidden />
      {t("verified")}
    </Badge>
  ) : (
    <Badge variant="neutral">{t("unverified")}</Badge>
  )
}

/** The source recorded for a fact key, matched case-insensitively. */
export function sourceOf(sources: Source[], key: string): Source | undefined {
  const canonical = key.toLowerCase()
  return sources.find((source) => source.key.toLowerCase() === canonical)
}

/** Where a figure comes from: source link, year, a stale mark, and "unverified" when nobody checked it. */
export function FactSource({ fact, source }: { fact: Pick<Fact, "verified">; source?: Source }) {
  const t = useT("chooser")
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {source?.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex min-h-6 items-center gap-1 underline-offset-2 hover:underline"
        >
          {t("source")}
          <Icons.externalLink className="size-3" aria-hidden />
        </a>
      ) : (
        <span>{t("noSource")}</span>
      )}
      {source?.year != null ? <span>{source.year}</span> : null}
      {isStale(source?.year ?? null) ? <Badge variant="warning">{t("stale")}</Badge> : null}
      {fact.verified ? null : <Badge variant="neutral">{t("unverified")}</Badge>}
    </span>
  )
}
