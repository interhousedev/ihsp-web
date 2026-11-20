"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { NextStep } from "../../../components/next-step"
import { useScreenContext } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useEssays } from "../api"
import { EssayFlow } from "../flow/essay-flow"

/** The essays section: one linear path from the prompt map down to matching essays to universities. */
export function EssaysBody() {
  const t = useT("essays")
  const entryId = useSearchParams().get("entry")
  const essays = useEssays().data?.items ?? []
  useScreenContext({
    title: t("title"),
    summary: `Essays: ${essays.length}. ${essays
      .map(
        (e) =>
          `"${e.title || t("untitled")}" (${e.kind}, ${e.status}, ${e.word_count}${e.word_limit ? `/${e.word_limit}` : ""} words)`,
      )
      .join("; ")}`,
  })
  return (
    <div className={pageClass()}>
      {entryId ? (
        <Link
          data-testid="essays-back"
          href={`/chooser/?step=list&entry=${encodeURIComponent(entryId)}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "self-start")}
        >
          <Icons.chevronLeft aria-hidden />
          {t("backToList")}
        </Link>
      ) : null}
      <AppPageHeader icon="post" title={t("title")} />
      <EssayFlow />
      <NextStep
        href={entryId ? `/documents/?entry=${encodeURIComponent(entryId)}` : "/documents/"}
        label={t("nextStep")}
      />
    </div>
  )
}

export function EssaysPage() {
  return (
    <AdmissionShell>
      <Suspense>
        <EssaysBody />
      </Suspense>
    </AdmissionShell>
  )
}
