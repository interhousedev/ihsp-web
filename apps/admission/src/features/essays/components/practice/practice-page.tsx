"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons, Pill, StateView, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { pageClass } from "../../../../components/lib/page"
import { AdmissionShell } from "../../../shell/components/admission-shell"
import { usePracticeHistory, usePracticeToday } from "../../flow/api"
import { PracticeHistory } from "./practice-history"
import { PracticeScore } from "./practice-score"
import { PastDay, PracticeWriter } from "./practice-writer"

type Pane = "write" | "score" | "history"

/** The card clips its corners; a column that scrolls does it inside, so the rounded corners and the scrollbar stay whole. */
function Column({ title, children, className, scroll }: { title: string; children: React.ReactNode; className?: string; scroll?: boolean }) {
  return (
    <section aria-label={title} className={cn("bg-card rounded-card flex min-h-0 min-w-0 flex-col overflow-hidden border", className)}>
      <h2 className="text-muted-foreground border-hairline shrink-0 border-b px-4 py-2 text-xs font-semibold tracking-wide uppercase">{title}</h2>
      {scroll ? <div className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto lg:[scrollbar-gutter:stable]">{children}</div> : children}
    </section>
  )
}

/** The practice workspace: history, today's prompt with the text, and the score; three columns on a desktop, tabs on a phone. */
export function PracticeBody() {
  const t = useT("essayPractice")
  const te = useT("essays")
  const today = usePracticeToday()
  const history = usePracticeHistory()
  const [day, setDay] = useState<string | null>(null)
  const [pane, setPane] = useState<Pane>("write")
  const past = day ? (history.data?.items ?? []).find((e) => e.day === day) : undefined
  const entry = past ?? today.data?.entry
  const pick = (next: string | null) => {
    setDay(next)
    setPane(next ? "score" : "write")
  }

  let writer
  if (today.isPending) writer = <StateView state="loading" rows={3} />
  else if (today.isError) writer = <StateView state="error" error={today.error} onRetry={() => void today.refetch()} />
  else if (past) writer = <PastDay entry={past} />
  else writer = <PracticeWriter today={today.data} onScored={() => setPane("score")} />

  const streak = today.data?.streak ?? 0
  return (
    <div className={pageClass("lg:h-[calc(100dvh-var(--shell-top-reserve,0px))] lg:min-h-0 lg:pb-4")}>
      <header className="flex min-w-0 flex-wrap items-center gap-3">
        <Link href="/essays/" className={buttonVariants({ variant: "ghost", size: "sm" })} data-testid="practice-back">
          <Icons.chevronLeft aria-hidden />
          {te("title")}
        </Link>
        <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight lg:text-2xl">{t("title")}</h1>
        <Pill tone={streak > 0 ? "primary" : "neutral"}>{t("streak", { count: streak })}</Pill>
      </header>
      <ToggleGroup value={[pane]} onValueChange={(v) => v[0] && setPane(v[0] as Pane)} aria-label={t("title")} variant="outline" className="w-full lg:hidden">
        {(["write", "score", "history"] as const).map((p) => (
          <ToggleGroupItem key={p} value={p} className="min-h-11 flex-1">
            {t(`pane.${p}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_22rem]">
        <Column title={t("history")} scroll className={cn(pane !== "history" && "max-lg:hidden")}>
          <PracticeHistory selected={day} onSelect={pick} />
        </Column>
        <Column title={t("writing")} className={cn(pane !== "write" && "max-lg:hidden")}>
          {writer}
        </Column>
        <Column title={t("score")} scroll className={cn(pane !== "score" && "max-lg:hidden")}>
          <PracticeScore entry={entry} canSeed={!past} />
        </Column>
      </div>
    </div>
  )
}

export function PracticePage() {
  return (
    <AdmissionShell>
      <PracticeBody />
    </AdmissionShell>
  )
}
