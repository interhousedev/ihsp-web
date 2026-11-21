"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { kbLibrary, MessageWithOpenUi, safeLinkUrl } from "@ihsp/features-core/openui"
import { buttonVariants, CopyButton, Icons, Markdown, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { QueryError } from "../../shell/components/query-error"
import { useKbArticle } from "../api"

export function ArticleReader({ id }: { id: string }) {
  const t = useT("kb")
  const locale = useLocale()
  const query = useKbArticle(id)
  const body_ = useRef<HTMLDivElement>(null)
  const [sections, setSections] = useState<{ slug: string; title: string; level: number }[]>([])
  const loaded = query.data?.id
  // Give every heading an anchor, list them, and open the one named by the address (`#section`).
  useEffect(() => {
    const root = body_.current
    if (!root) return
    const used = new Set<string>()
    const found = [...root.querySelectorAll<HTMLElement>("h1, h2, h3")].map((node) => {
      const title = node.textContent?.trim() ?? ""
      const base =
        title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-|-$/g, "") || "section"
      let slug = base
      for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`
      used.add(slug)
      node.id = slug
      node.style.scrollMarginTop = "5rem"
      return { slug, title, level: node.tagName === "H3" ? 3 : 2 }
    })
    setSections(found)
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [loaded])
  const link = (hash?: string) =>
    `${window.location.origin}/faq/?id=${encodeURIComponent(id)}${hash ? `#${encodeURIComponent(hash)}` : ""}`
  let body
  if (query.isPending) body = <Skeleton className="h-64 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else {
    const article = query.data
    body = (
      <article className="flex max-w-prose flex-col gap-4 leading-relaxed">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-2xl font-semibold break-words">{article.title}</h2>
            <p className="text-muted-foreground text-xs">
              {t("updated", { date: new Date(article.updated_at).toLocaleDateString(locale) })}
            </p>
          </div>
          <CopyButton value={link()} label={t("shareArticle")} size="sm" />
        </div>
        {sections.length > 1 ? (
          <nav aria-label={t("onThisPage")} className="bg-muted/40 rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">{t("onThisPage")}</p>
            <ul className="flex flex-col">
              {sections.map((section) => (
                <li key={section.slug} className={`flex items-center gap-1 ${section.level === 3 ? "ps-4" : ""}`}>
                  <a className="min-w-0 flex-1 py-1 hover:underline" href={`#${encodeURIComponent(section.slug)}`}>
                    {section.title}
                  </a>
                  <span className="shrink-0">
                    <CopyButton value={link(section.slug)} label={undefined} variant="ghost" size="icon" />
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div ref={body_}>
          <MessageWithOpenUi
            text={article.body}
            library={kbLibrary}
            links="kb"
            renderMarkdown={(part) => (
              <Markdown allowLink={(href) => safeLinkUrl(href, "kb") !== null}>{part}</Markdown>
            )}
          />
        </div>
      </article>
    )
  }
  return (
    <div className="bg-card rounded-card flex flex-col gap-4 border p-4 md:p-6" data-testid="kb-reader">
      <Link href="/faq/" className={`${buttonVariants({ variant: "ghost", size: "sm" })} self-start`}>
        <Icons.chevronLeft aria-hidden />
        {t("back")}
      </Link>
      {body}
    </div>
  )
}
