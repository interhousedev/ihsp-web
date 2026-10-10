"use client"

import type { SourceSearchGroup } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconLoader2 } from "@ihsp/ui"
import { useWorkspace } from "../workspace-context"
import { InTextSource } from "./in-text-source"

type InTextGroupProps = {
  groups: readonly SourceSearchGroup[]
  /** The search is still running: a quiet "Searching in the text…" row. */
  pending: boolean
  /** The typed words, marked in the snippets. */
  query: string
}

/**
 * The "In the text" group under the matching titles: the sources whose passages contain the words, each hit opening the
 * viewer at that passage (which scrolls to it and highlights it). Nothing at all when there is no hit and no search.
 */
export function InTextGroup({ groups, pending, query }: InTextGroupProps) {
  const t = useT("notebooks")
  const { openSource } = useWorkspace()
  if (groups.length === 0 && !pending) return null
  return (
    <section aria-label={t("sources.inText")} className="flex flex-col">
      <h3 className="text-muted-foreground flex min-h-11 items-center gap-1 px-2 text-xs font-medium tracking-wide uppercase md:min-h-8">
        <span>{t("sources.inText")}</span>
        {groups.length > 0 ? <span className="tabular-nums">{`(${groups.length})`}</span> : null}
      </h3>
      {pending ? (
        <p role="status" className="text-muted-foreground flex items-center gap-1.5 px-2 py-1 text-xs">
          <IconLoader2 aria-hidden className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
          {t("sources.inTextLoading")}
        </p>
      ) : null}
      {groups.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {groups.map((group) => (
            <InTextSource key={group.source_id} group={group} query={query} onOpen={openSource} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}
