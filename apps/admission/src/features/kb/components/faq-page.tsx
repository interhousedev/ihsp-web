"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ArticleList } from "./article-list"
import { ArticleReader } from "./article-reader"
import { FaqChat } from "./faq-chat"

function FaqBody() {
  const locale = useLocale()
  const id = useSearchParams().get("id")
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="order-2 min-w-0 lg:order-1">
        <ArticleList locale={locale} activeId={id} />
      </aside>
      <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
        {id ? <ArticleReader id={id} /> : null}
        {/* The chat stays mounted behind the reader so a conversation survives opening a citation. */}
        <div className={id ? "hidden" : "flex flex-col"}>
          <FaqChat />
        </div>
      </div>
    </div>
  )
}

export function FaqPage() {
  const t = useT("kb")
  return (
    <AdmissionShell>
      <div className={pageClass("wide")}>
        <AppPageHeader icon="help" title={t("title")} />
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <FaqBody />
        </Suspense>
      </div>
    </AdmissionShell>
  )
}
