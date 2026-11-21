"use client"

import { useT } from "@ihsp/i18n"
import { SourceChip } from "../fact-source"

type Sourced = { source_url: string | null; year: number | null }

/**
 * One source line for a whole section instead of a pill under every fact: the distinct sources of its rows side by
 * side; "Unverified" appears once, and only when no row of the section has a source.
 */
export function SectionSource({ rows }: { rows: readonly Sourced[] }) {
  const t = useT("chooserDetails")
  const seen = new Set<string>()
  const sources = rows.filter((row) => {
    if (!row.source_url) return false
    const key = `${row.source_url}|${row.year ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (rows.length === 0) return null
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs" data-testid="section-source">
      <span>{t("sourceLine")}</span>
      {sources.length === 0 ? <SourceChip url={null} year={null} /> : null}
      {sources.slice(0, 3).map((row) => (
        <SourceChip key={`${row.source_url}|${row.year}`} url={row.source_url} year={row.year} />
      ))}
      {sources.length > 3 ? <span>+{sources.length - 3}</span> : null}
    </p>
  )
}
