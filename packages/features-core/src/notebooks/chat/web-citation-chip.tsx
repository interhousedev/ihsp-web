"use client"

import type { WebResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { HoverCard, HoverCardContent, HoverCardTrigger, cn } from "@ihsp/ui"
import { IconWorld } from "@ihsp/ui"
import { WebCitationCard } from "./web-citation-card"
import { PlatformBadge } from "./platform-badge"

type WebCitationChipProps = {
  /** The numbers of one `⟦w1,3⟧` marker. */
  numbers: readonly number[]
  /** The pages the web search found for the answer. */
  web: readonly WebResult[]
  className?: string
}

/**
 * A small bordered pill with a globe and the site of the first cited page (`+1` for more) for a `⟦w1⟧` marker, apart
 * from the numbered source chips: "your sources" and "the web" never look alike. Hover or focus shows the page(s),
 * a click opens the first page in a new tab. Works anywhere (no notebook needed). A number without a result renders
 * nothing.
 */
export function WebCitationChip({ numbers, web, className }: WebCitationChipProps) {
  const t = useT("assistant.web")
  const results = numbers.flatMap((n) => web.find((item) => item.n === n) ?? [])
  const [first] = results
  if (!first) return null
  const more = results.length - 1
  const label = t("chip", { n: first.n, title: first.title })

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={150}
        closeDelay={100}
        render={
          <a
            href={first.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={more > 0 ? `${label}, ${t("more", { site: first.site, count: more })}` : label}
            data-web-citation={first.n}
            className={cn(
              "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring relative mx-0.5 inline-flex h-5 max-w-48 items-center gap-1 rounded-full border px-1.5 align-baseline text-[11px] leading-none font-medium no-underline outline-hidden focus-visible:ring-2",
              // A larger invisible hit area keeps the chip small but easy to tap.
              "after:absolute after:-inset-2",
              className,
            )}
          />
        }
      >
        <IconWorld className="size-3 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{first.site}</span>
        <PlatformBadge origin={first.origin} className="h-3.5" />
        {more > 0 ? <span className="shrink-0 tabular-nums">{`+${more}`}</span> : null}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 max-w-[calc(100vw-2rem)]" side="top">
        <WebCitationCard results={results} />
      </HoverCardContent>
    </HoverCard>
  )
}
