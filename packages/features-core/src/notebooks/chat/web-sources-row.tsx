"use client"

import type { WebResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconChevronDown, IconWorld } from "@ihsp/ui"
import { useId, useState } from "react"
import { citedWebNumbers } from "../lib/citations"
import { PlatformBadge } from "./platform-badge"

type WebSourcesRowProps = {
  /** The pages the web search found for the answer. */
  web: readonly WebResult[]
  /** The answer text: the pages its `⟦w1⟧` markers cite come first, in the order they appear. */
  text: string
}

/** The pages cited in the text (in text order), then those the server flags as cited, then the others. */
function orderedPages(web: readonly WebResult[], text: string): WebResult[] {
  const inText = citedWebNumbers(text).flatMap((n) => web.find((item) => item.n === n) ?? [])
  const rest = web.filter((item) => !inText.includes(item))
  return [...inText, ...rest.filter((item) => item.cited), ...rest.filter((item) => !item.cited)]
}

/**
 * Under an answer that used the web: a collapsed "Sources · N" button that opens the list of pages (number, title
 * link, site, one line of the snippet), the cited ones first.
 */
export function WebSourcesRow({ web, text }: WebSourcesRowProps) {
  const t = useT("assistant.web")
  const listId = useId()
  const [open, setOpen] = useState(false)
  if (web.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground -ms-2 min-h-11 px-2 md:min-h-8"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <IconWorld aria-hidden />
        {t("sources", { count: web.length })}
        <IconChevronDown
          aria-hidden
          className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </Button>
      {open ? (
        <ul id={listId} aria-label={t("list")} className="flex w-full min-w-0 flex-col gap-2">
          {orderedPages(web, text).map((page) => (
            <li key={page.n} className="flex min-w-0 items-start gap-2">
              <span className="bg-muted text-muted-foreground mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-[11px] leading-none font-medium tabular-nums">
                {page.n}
              </span>
              <div className="flex min-w-0 flex-col">
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="focus-visible:ring-ring min-w-0 rounded-sm text-sm font-medium break-words underline-offset-2 outline-hidden hover:underline focus-visible:ring-2"
                >
                  {page.title}
                </a>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  {page.site}
                  <PlatformBadge origin={page.origin} />
                </span>
                <span className="text-muted-foreground truncate text-xs">{page.snippet}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
