"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Icons, Skeleton, cn } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ArticleList } from "./article-list"
import { ArticleReader } from "./article-reader"
import { FaqChat } from "./faq-chat"

function FaqBody() {
  const locale = useLocale()
  const id = useSearchParams().get("id")
  const t = useT("kb")
  // On phones the assistant folds into a bar so the articles come first; from lg up it is always open.
  const [chatOpen, setChatOpen] = useState(false)
  return (
    <div className="grid min-h-0 items-start gap-6 lg:h-[calc(100dvh-11rem)] lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="order-2 flex min-h-0 min-w-0 flex-col lg:order-1 lg:h-full">
        <ArticleList locale={locale} activeId={id} />
      </aside>
      <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2 lg:h-full lg:min-h-0 lg:overflow-y-auto">
        {id ? <ArticleReader id={id} /> : null}
        {/* The chat stays mounted behind the reader so a conversation survives opening a citation. */}
        <div className={id ? "hidden" : "flex flex-col gap-3"}>
          <button
            type="button"
            aria-expanded={chatOpen}
            aria-controls="faq-chat-panel"
            onClick={() => setChatOpen((open) => !open)}
            className="bg-card border-primary/60 rounded-card hover:bg-accent flex min-h-11 items-center gap-2 border px-4 text-sm font-medium lg:hidden"
          >
            <Icons.sparkles className="text-primary size-4" aria-hidden />
            <span className="flex-1 text-start">{t("askAssistant")}</span>
            <Icons.chevronDown className={cn("size-4 transition-transform", chatOpen && "rotate-180")} aria-hidden />
          </button>
          <div id="faq-chat-panel" className={cn("flex-col", chatOpen ? "flex" : "hidden lg:flex")}>
            <FaqChat />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FaqPage() {
  const t = useT("kb")
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader icon="help" title={t("title")} />
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <FaqBody />
        </Suspense>
      </div>
    </AdmissionShell>
  )
}
