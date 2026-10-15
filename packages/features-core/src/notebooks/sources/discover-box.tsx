"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Input, NativeSelect, NativeSelectOption } from "@ihsp/ui"
import { IconArrowRight, IconLoader2 } from "@ihsp/ui"
import { useId, useState, type FocusEvent, type FormEvent } from "react"
import { useWebQuota } from "../../web-search"
import { MIN_SEARCH_LENGTH } from "./constants"
import { useWebSearchPrefill } from "./web-search-prefill"
import type { DiscoverFlow, DiscoverMode } from "./use-discover"

type DiscoverBoxProps = {
  flow: DiscoverFlow
  /** The notebook already has sources: only the input shows until the box is focused or has a query. */
  compact: boolean
}

/**
 * "Find new sources on the internet": a query field, a Fast / Deep search pill with its cost, the arrow that sends it
 * and today's quota. Renders nothing when web search is turned off. The results replace the source list
 * (`DiscoverResults`); the quota line is the quota cache, which every search updates.
 */
export function DiscoverBox({ flow, compact }: DiscoverBoxProps) {
  const t = useT("notebooks")
  const composer = useT("assistant.composer")
  const format = useFormatters()
  const { quota, enabled, remaining, spent } = useWebQuota()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<DiscoverMode>("fast")
  const [focused, setFocused] = useState(false)
  const quotaId = useId()
  useWebSearchPrefill(setQuery)
  if (!enabled || !quota) return null

  const text = query.trim()
  const cost = mode === "deep" ? quota.deep_cost : 1
  const canSend = text.length >= MIN_SEARCH_LENGTH && remaining >= cost && !flow.pending
  const expanded = !compact || focused || query !== ""

  function send(event: FormEvent) {
    event.preventDefault()
    if (canSend) flow.run(text, mode)
  }

  function leave(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  return (
    <div className="px-3 md:px-4">
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the form only watches focus enter and leave its fields */}
      <form
        role="search"
        aria-label={t("discover.placeholder")}
        onSubmit={send}
        onFocus={() => setFocused(true)}
        onBlur={leave}
        className="bg-muted/50 flex flex-col gap-2 rounded-2xl p-3"
      >
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={query}
            aria-label={t("discover.placeholder")}
            aria-describedby={expanded ? quotaId : undefined}
            placeholder={t("discover.placeholder")}
            autoComplete="off"
            enterKeyHint="search"
            className="bg-background h-11 flex-1 md:h-8"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-full md:size-8"
            aria-label={t("discover.submit")}
            disabled={!canSend}
          >
            {flow.pending ? (
              <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" />
            ) : (
              <IconArrowRight aria-hidden />
            )}
          </Button>
        </div>
        {expanded ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <NativeSelect
              className="[&_select]:h-11 md:[&_select]:h-8 [&_select]:rounded-full [&_select]:ps-3"
              aria-label={t("discover.mode")}
              value={mode}
              onChange={(event) => setMode(event.target.value === "deep" ? "deep" : "fast")}
            >
              <NativeSelectOption value="fast">
                {`${t("discover.fast")} · ${t("discover.cost", { count: 1 })}`}
              </NativeSelectOption>
              <NativeSelectOption value="deep">
                {`${t("discover.deep")} · ${t("discover.cost", { count: quota.deep_cost })}`}
              </NativeSelectOption>
            </NativeSelect>
            <p id={quotaId} role="status" className="text-muted-foreground text-xs">
              {spent
                ? composer("webNone", { time: format.time(quota.resets_at) })
                : quota.limit === null
                  ? null
                  : composer("webQuota", { remaining: remaining ?? 0, limit: quota.limit })}
            </p>
          </div>
        ) : null}
        {flow.error ? (
          <p role="alert" className="text-destructive text-xs">
            {flow.error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
