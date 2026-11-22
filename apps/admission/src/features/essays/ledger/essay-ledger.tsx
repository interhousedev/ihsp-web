"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { NextStep } from "../../../components/next-step"
import { useEssays } from "../api"
import { useWide } from "../components/editor/use-wide"
import { usePromptMap } from "../flow/api"
import { ExamplesPanel } from "../flow/examples-panel"
import { IdeasPanel } from "../flow/ideas-panel"
import { GroupDrawer } from "./group-drawer"
import { LedgerToolbar } from "./ledger-controls"
import { ExamplesCard, IdeasCard, PracticeCard } from "./ledger-aside"
import { buildLedger, buildSections, filterRows, summarize } from "./ledger-model"
import { LedgerSectionBlock } from "./ledger-sections"
import { LedgerSheet } from "./ledger-sheet"
import { useCollapsed, useLedgerView } from "./ledger-state"
import { UniBoard } from "./uni-board"
import { UnreadableEssays } from "./unreadable-essays"

/** The data of the ledger page: the prompt groups of the chosen scope joined with the student's essays. */
export function useLedger() {
  const view = useLedgerView()
  const map = usePromptMap(view.scope)
  const essays = useEssays()
  const [query, setQuery] = useState("")
  const rows = useMemo(
    () =>
      buildLedger(
        map.data?.groups ?? [],
        (essays.data?.items ?? []).filter((e) => !e.unreadable),
        view.scope,
      ),
    [map.data, essays.data, view.scope],
  )
  const sections = useMemo(() => buildSections(rows), [rows])
  const summary = useMemo(() => summarize(sections), [sections])
  const shown = useMemo(() => buildSections(filterRows(rows, query)), [rows, query])
  return { view, map, essays, rows, sections, shown, summary, query, setQuery, ready: !!map.data && !!essays.data }
}

export type Ledger = ReturnType<typeof useLedger>

/** The ledger body: the toolbar, the sections of rows or the university board, and the panel with practice, ideas and examples. */
export function EssayLedger({ ledger, nextHref, nextLabel }: { ledger: Ledger; nextHref: string; nextLabel: string }) {
  const t = useT("essayLedger")
  const wide = useWide()
  const router = useRouter()
  const { collapsed, toggle } = useCollapsed()
  const { view, map, essays, rows, shown, query } = ledger
  const open = rows.find((r) => r.group.key === view.group) ?? null
  const byUni = view.lens === "uni"

  useEffect(() => {
    if (view.practiceLink) router.replace("/essays/practice/")
  }, [view.practiceLink, router])

  const aside = (
    <div className="flex flex-col gap-3">
      <PracticeCard />
      <IdeasCard onOpen={() => view.set({ drawer: "ideas" })} />
      <ExamplesCard onOpen={() => view.set({ drawer: "examples" })} />
      <NextStep href={nextHref} label={nextLabel} />
    </div>
  )

  let body
  if (byUni) body = <UniBoard />
  else if (map.isPending || essays.isPending) body = <Skeleton className="h-72 w-full" />
  else if (map.isError) body = <StateView state="error" error={map.error} onRetry={() => void map.refetch()} />
  else if (essays.isError) body = <StateView state="error" error={essays.error} onRetry={() => void essays.refetch()} />
  else if (rows.length === 0)
    body = (
      <StateView
        state="empty"
        icon={<Icons.post aria-hidden />}
        title={t("emptyTitle")}
        description={t(view.scope === "list" ? "emptyList" : "emptyAll")}
        action={
          view.scope === "list" ? (
            <Button type="button" variant="outline" onClick={() => view.set({ scope: "all" })}>
              {t("showAllPrompts")}
            </Button>
          ) : undefined
        }
      />
    )
  else if (shown.length === 0)
    body = (
      <StateView
        state="empty"
        icon={<Icons.search aria-hidden />}
        title={t("noMatch")}
        description={t("noMatchText", { query })}
      />
    )
  else
    body = (
      <div className="flex flex-col gap-1" data-testid="ledger-rows">
        {shown.map((section) => (
          <LedgerSectionBlock
            key={section.type}
            section={section}
            collapsed={collapsed.includes(section.type)}
            forceOpen={query.trim().length > 0}
            onToggle={() => toggle(section.type)}
            onOpen={(key) => view.set({ group: key })}
          />
        ))}
      </div>
    )

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {wide || byUni ? null : <PracticeCard />}
        <LedgerToolbar
          scope={view.scope}
          lens={view.lens}
          query={ledger.query}
          onQuery={ledger.setQuery}
          onScope={(scope) => view.set({ scope: scope === "all" ? "all" : null })}
          onLens={(lens) => view.set({ lens: lens === "uni" ? "uni" : null })}
        />
        <div className={cn("grid min-h-0 flex-1 gap-4", !byUni && "lg:grid-cols-[minmax(0,1fr)_19rem]")}>
          <div
            className={cn(
              "min-h-0 min-w-0",
              !byUni && "lg:bg-card lg:rounded-card lg:overflow-y-auto lg:border lg:[scrollbar-gutter:stable]",
            )}
          >
            {byUni ? null : <UnreadableEssays essays={(essays.data?.items ?? []).filter((e) => e.unreadable)} />}
            {body}
          </div>
          {wide && !byUni ? <div className="min-h-0 overflow-y-auto [scrollbar-gutter:stable]">{aside}</div> : null}
        </div>
        {wide || byUni ? null : (
          <div className="flex flex-col gap-3">
            <IdeasCard onOpen={() => view.set({ drawer: "ideas" })} />
            <ExamplesCard onOpen={() => view.set({ drawer: "examples" })} />
            <NextStep href={nextHref} label={nextLabel} />
          </div>
        )}
      </div>

      <GroupDrawer row={open} onClose={() => view.set({ group: null })} />
      <LedgerSheet
        open={view.drawer === "ideas"}
        onOpenChange={(o) => !o && view.set({ drawer: null })}
        title={t("ideasHeading")}
      >
        <IdeasPanel />
      </LedgerSheet>
      <LedgerSheet
        open={view.drawer === "examples"}
        onOpenChange={(o) => !o && view.set({ drawer: null })}
        title={t("examplesTitle")}
      >
        <ExamplesPanel />
      </LedgerSheet>
    </>
  )
}
