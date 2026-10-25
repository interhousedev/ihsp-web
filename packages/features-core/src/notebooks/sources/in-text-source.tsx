"use client"

import type { SourceSearchGroup } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { SourceKindIcon } from "../lib/source-icons"
import { HighlightedText } from "./highlighted-text"

type InTextSourceProps = {
  group: SourceSearchGroup
  query: string
  onOpen: (sourceId: string, passageId: string) => void
}

/** One source with passages that contain the words: its title and up to 3 hits, each opening the viewer at the passage. */
export function InTextSource({ group, query, onOpen }: InTextSourceProps) {
  const t = useT("notebooks")
  return (
    <li className="flex flex-col">
      <div className="flex min-h-8 items-center gap-2 px-2">
        <SourceKindIcon kind={group.kind} title={group.title} className="size-5" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={group.title}>
          {group.title}
        </span>
      </div>
      <ul aria-label={group.title} className="flex flex-col gap-0.5">
        {group.hits.map((hit) => (
          <li key={hit.passage_id}>
            <button
              type="button"
              onClick={() => onOpen(group.source_id, hit.passage_id)}
              className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-11 w-full items-start rounded-lg py-1.5 ps-9 pe-2 text-start text-xs outline-hidden focus-visible:ring-2"
            >
              <span className="line-clamp-3 break-words">
                {hit.page !== null ? (
                  <span className="text-muted-foreground me-1">{`${t("viewer.page", { page: hit.page })} ·`}</span>
                ) : null}
                <HighlightedText text={hit.snippet} query={query} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  )
}
