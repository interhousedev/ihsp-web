"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Input, Skeleton, StateView, cn } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { QueryError } from "../../shell/components/query-error"
import { useKbArticles } from "../api"

/** A known topic tag in the UI language, otherwise the tag humanized. */
type TopicTranslator = { (key: string): string; has: (key: string) => boolean }

function topicLabel(t: TopicTranslator, tag: string): string {
  const key = tag.toLowerCase().replace(/[^a-z0-9]+/g, "_")
  if (t.has(`topics.${key}`)) return t(`topics.${key}`)
  const text = tag.replace(/[_-]+/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** The searchable list of published articles in one language, filtered by tag. */
export function ArticleList({ locale, activeId }: { locale: string; activeId: string | null }) {
  const t = useT("kb")
  const [q, setQ] = useState("")
  const [tag, setTag] = useState<string | null>(null)
  const all = useKbArticles({ locale, status: "published" })
  const query = useKbArticles({ locale, q: q.trim(), tag: tag ?? undefined, status: "published" })
  const tags = [...new Set((all.data?.items ?? []).flatMap((article) => article.tags))].sort()

  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0) body = <StateView state="empty" title={t("none")} />
  else
    body = (
      <ul className="flex flex-col gap-1">
        {query.data.items.map((article) => (
          <li key={article.id}>
            <Link
              href={`/faq/?id=${encodeURIComponent(article.id)}`}
              aria-current={article.id === activeId ? "page" : undefined}
              className={cn(
                "hover:bg-accent block rounded-lg px-3 py-2 text-sm",
                article.id === activeId && "bg-accent font-medium",
              )}
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative">
        <Icons.search className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="ps-9"
        />
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("allTags")}>
          {[null, ...tags].map((value) => (
            <button
              key={value ?? "all"}
              type="button"
              aria-pressed={tag === value}
              onClick={() => setTag(value)}
              className={cn(
                "min-h-11 rounded-full border px-3 py-1 text-xs md:min-h-0",
                tag === value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
              )}
            >
              {value === null ? t("allTags") : topicLabel(t, value)}
            </button>
          ))}
        </div>
      ) : null}
      {body}
    </div>
  )
}
