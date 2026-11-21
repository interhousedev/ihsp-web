"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useScreenContext } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { EssayLedger, useLedger } from "../ledger/essay-ledger"
import { LedgerSentence } from "../ledger/ledger-controls"
import { useStartEssay } from "../ledger/use-start-essay"

/** The essays home: a ledger of what is owed (one row per prompt group), a university board, and today's practice. */
export function EssaysBody() {
  const t = useT("essays")
  const tl = useT("essayLedger")
  const entryId = useSearchParams().get("entry")
  const ledger = useLedger()
  const blank = useStartEssay()
  const essays = ledger.essays.data?.items ?? []
  useScreenContext({
    title: t("title"),
    summary: `Essays: ${essays.length}. ${essays
      .map(
        (e) =>
          `"${e.title || t("untitled")}" (${e.kind}, ${e.status}, ${e.word_count}${e.word_limit ? `/${e.word_limit}` : ""} words${e.uniqueness === null ? "" : `, uniqueness ${e.uniqueness}`})`,
      )
      .join("; ")}`,
  })
  return (
    <div
      className={pageClass(
        ledger.view.lens === "uni"
          ? "md:h-[calc(100dvh-var(--shell-top-reserve,0px))] md:min-h-0 md:pb-4"
          : "lg:h-[calc(100dvh-var(--shell-top-reserve,0px))] lg:min-h-0 lg:pb-4",
      )}
    >
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
      <AppPageHeader
        icon="post"
        title={t("title")}
        meta={ledger.ready ? <LedgerSentence summary={ledger.summary} /> : undefined}
        actions={
          <Button type="button" disabled={blank.pending} onClick={blank.startBlank}>
            <Icons.add aria-hidden />
            {tl("newEssay")}
          </Button>
        }
      />
      <EssayLedger
        ledger={ledger}
        nextHref={entryId ? `/documents/?entry=${encodeURIComponent(entryId)}` : "/documents/"}
        nextLabel={t("nextStep")}
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
