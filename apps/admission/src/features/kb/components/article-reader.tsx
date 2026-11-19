"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { kbLibrary, MessageWithOpenUi, safeLinkUrl } from "@ihsp/features-core/openui"
import { buttonVariants, Icons, Markdown, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { QueryError } from "../../shell/components/query-error"
import { useKbArticle } from "../api"

export function ArticleReader({ id }: { id: string }) {
  const t = useT("kb")
  const locale = useLocale()
  const query = useKbArticle(id)
  let body
  if (query.isPending) body = <Skeleton className="h-64 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else {
    const article = query.data
    body = (
      <article className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{article.title}</h2>
        <p className="text-muted-foreground text-xs">
          {t("updated", { date: new Date(article.updated_at).toLocaleDateString(locale) })}
        </p>
        <MessageWithOpenUi
          text={article.body}
          library={kbLibrary}
          links="kb"
          renderMarkdown={(part) => <Markdown allowLink={(href) => safeLinkUrl(href, "kb") !== null}>{part}</Markdown>}
        />
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
