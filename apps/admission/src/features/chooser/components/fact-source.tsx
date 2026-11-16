"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Icons } from "@ihsp/ui"
import type { Fact } from "../types"

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

/** Where a figure comes from: source link, year, a stale mark, and "unverified" when nobody checked it. */
export function FactSource({ fact }: { fact: Pick<Fact, "source_url" | "year" | "verified" | "note"> }) {
  const t = useT("chooser")
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {fact.source_url ? (
        <a
          href={fact.source_url}
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
      {fact.year !== null ? <span>{fact.year}</span> : null}
      {isStale(fact.year) ? <Badge variant="warning">{t("stale")}</Badge> : null}
      {fact.verified ? null : <Badge variant="neutral">{t("unverified")}</Badge>}
      {fact.note ? <span>{fact.note}</span> : null}
    </span>
  )
}
