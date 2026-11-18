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
  const href = source?.url ? safeHref(source.url) : undefined
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {href ? (
        <a
          href={href}
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

/** "domain.com" of a source link, without a leading "www."; the raw text when it is not a URL. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** The URL when it is an https link without credentials; anything else (javascript:, http:, garbage) is not linked. */
export function safeHref(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? url : undefined
  } catch {
    return undefined
  }
}

/** Small chip for one recorded row: "2025 · domain.com" linking out, or a muted "Unverified" without a source. */
export function SourceChip({ url, year }: { url: string | null; year: number | null }) {
  const t = useT("chooserDetails")
  if (!url) return <span className="text-muted-foreground text-xs">{t("unverified")}</span>
  const host = sourceHost(url)
  const label = year != null ? `${year} · ${host}` : host
  const href = safeHref(url)
  if (!href) return <span className="text-muted-foreground max-w-full truncate text-xs">{label}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("sourceLink", { host })}
      className="border-hairline-strong text-muted-foreground hover:text-foreground inline-flex min-h-6 max-w-full items-center gap-1 rounded-full border px-2 text-xs"
    >
      <span className="truncate">{label}</span>
      <Icons.externalLink className="size-3 shrink-0" aria-hidden />
    </a>
  )
}
