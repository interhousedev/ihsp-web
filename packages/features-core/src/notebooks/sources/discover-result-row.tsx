"use client"

import type { DiscoverResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Checkbox, cn } from "@ihsp/ui"
import { IconAlertTriangle, IconExternalLink } from "@ihsp/ui"
import { useId } from "react"
import { PlatformBadge } from "../chat/platform-badge"

type DiscoverResultRowProps = {
  result: DiscoverResult
  checked: boolean
  /** The page is already a source (before this search or just now): shown ticked off and disabled. */
  taken: boolean
  /** The selection cannot grow any more. */
  full: boolean
  /** Why the notebook refused this page; shown under it. */
  refusal?: string | undefined
  onToggle: () => void
}

/** Only web pages are opened from here; anything else a search result might carry gets no link. */
function isWebPage(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === "https:" || protocol === "http:"
  } catch {
    return false
  }
}

/**
 * One found page: a tickable row (tapping anywhere ticks it) with title, "site · why", two lines of the snippet and a
 * link that opens the page in a new tab. A page that is already a source cannot be ticked.
 */
export function DiscoverResultRow({ result, checked, taken, full, refusal, onToggle }: DiscoverResultRowProps) {
  const t = useT("notebooks")
  const detailsId = useId()
  const disabled = taken || (full && !checked)
  const details = [result.site, result.why].filter(Boolean).join(" · ")
  return (
    <li
      className={cn(
        "relative flex min-h-11 items-start gap-3 rounded-lg border px-3 py-2",
        disabled ? "bg-muted/40 text-muted-foreground" : "hover:bg-muted cursor-pointer",
        checked && !disabled && "border-primary/50 bg-primary/5",
      )}
    >
      {/* The checkbox's hit area is stretched over the whole row; the link sits above it. */}
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={result.title}
        aria-describedby={detailsId}
        className="static mt-0.5 size-5 after:inset-0"
        onCheckedChange={onToggle}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium break-words">
          {result.title} <PlatformBadge origin={result.origin} className="align-middle" />
        </span>
        <span id={detailsId} className="text-muted-foreground flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="truncate">{details}</span>
          <span className="line-clamp-2 break-words">{result.snippet}</span>
        </span>
        {taken ? <span className="text-muted-foreground text-xs">{t("discover.already")}</span> : null}
        {refusal ? (
          <span role="alert" className="text-destructive flex items-start gap-1.5 text-xs">
            <IconAlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0 break-words">{refusal}</span>
          </span>
        ) : null}
      </span>
      {isWebPage(result.url) ? (
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={t("discover.open", { title: result.title })}
          className="text-muted-foreground hover:text-foreground hover:bg-background focus-visible:ring-ring relative z-10 -my-1 -me-2 flex size-11 shrink-0 items-center justify-center rounded-lg outline-hidden focus-visible:ring-2 md:size-8"
        >
          <IconExternalLink aria-hidden className="size-4" />
        </a>
      ) : null}
    </li>
  )
}
