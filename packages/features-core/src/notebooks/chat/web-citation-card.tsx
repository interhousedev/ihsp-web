"use client"

import type { WebResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconArrowUpRight } from "@tabler/icons-react"

/** The hover card of a web chip: for each page its title, site, two lines of the snippet, the address and a link. */
export function WebCitationCard({ results }: { results: readonly WebResult[] }) {
  const t = useT("assistant.web")
  return (
    <ul className="flex flex-col gap-3">
      {results.map((result) => (
        <li key={result.n} className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-medium break-words">{result.title}</p>
          <p className="text-muted-foreground text-xs">{result.site}</p>
          <p className="line-clamp-2 text-sm break-words">{result.snippet}</p>
          <p className="text-muted-foreground text-xs break-all">{result.url}</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary focus-visible:ring-ring inline-flex items-center gap-0.5 self-start rounded-sm text-xs font-medium underline-offset-2 outline-hidden hover:underline focus-visible:ring-2"
          >
            {t("open")}
            <IconArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}
