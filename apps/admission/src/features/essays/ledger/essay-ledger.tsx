"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useMemo } from "react"
import { useEssays } from "../api"
import { useWide } from "../components/editor/use-wide"
import { ExamplesPanel } from "../flow/examples-panel"
import { IdeasPanel } from "../flow/ideas-panel"
import { usePromptMap } from "../flow/api"
import { PracticeStep } from "../flow/practice-step"
import { GroupDrawer } from "./group-drawer"
import { LedgerSentence, LedgerToggles } from "./ledger-controls"
import { buildLedger, summarize } from "./ledger-model"
import { ExamplesCard, IdeasCard, PracticeCard } from "./ledger-aside"
import { LedgerRowButton } from "./ledger-row"
import { LedgerSheet } from "./ledger-sheet"
import { useLedgerView } from "./ledger-state"
import { UniBoard } from "./uni-board"

/** The data of the ledger page: the prompt groups of the chosen scope joined with the student's essays. */
export function useLedger() {
  const view = useLedgerView()
  const map = usePromptMap(view.scope)
  const all = usePromptMap("all")
  const essays = useEssays()
  const rows = useMemo(
    () => buildLedger(map.data?.groups ?? [], essays.data?.items ?? [], view.scope),
    [map.data, essays.data, view.scope],
  )
  const summary = useMemo(() => summarize(rows), [rows])
  return { view, map, all, essays, rows, summary, ready: !!map.data && !!essays.data }
}

export type Ledger = ReturnType<typeof useLedger>

/** The ledger body: the toggles, the rows or the university board, and the panel with practice, ideas and examples. */
export function EssayLedger({ ledger }: { ledger: Ledger }) {
  const t = useT("essayLedger")
  const wide = useWide()
  const { view, map, all, essays, rows } = ledger
  const open = rows.find((r) => r.group.key === view.group) ?? null

  const aside = (
    <div className="flex flex-col gap-3">
      <PracticeCard onOpen={() => view.set({ drawer: "practice" })} />
      <IdeasCard onOpen={() => view.set({ drawer: "ideas" })} />
      <ExamplesCard onOpen={() => view.set({ drawer: "examples" })} />
    </div>
  )

  let body
  if (view.lens === "uni") body = <UniBoard />
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
  else
    body = (
      <ul className="flex flex-col gap-2" data-testid="ledger-rows">
        {rows.map((row) => (
          <LedgerRowButton key={row.group.key} row={row} onOpen={() => view.set({ group: row.group.key })} />
        ))}
      </ul>
    )

  return (
    <>
      <div className="flex flex-col gap-4">
        <LedgerToggles
          scope={view.scope}
          lens={view.lens}
          allCount={all.data?.groups.length ?? null}
          onScope={(scope) => view.set({ scope: scope === "all" ? "all" : null })}
          onLens={(lens) => view.set({ lens: lens === "uni" ? "uni" : null })}
        />
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">{body}</div>
          {wide ? <div className="sticky top-4">{aside}</div> : null}
        </div>
        {wide ? null : aside}
      </div>

      <GroupDrawer row={open} onClose={() => view.set({ group: null })} />
      <LedgerSheet open={view.drawer === "practice"} onOpenChange={(o) => !o && view.set({ drawer: null })} title={t("practiceTitle")}>
        <PracticeStep />
      </LedgerSheet>
      <LedgerSheet open={view.drawer === "ideas"} onOpenChange={(o) => !o && view.set({ drawer: null })} title={t("ideasHeading")}>
        <IdeasPanel />
      </LedgerSheet>
      <LedgerSheet open={view.drawer === "examples"} onOpenChange={(o) => !o && view.set({ drawer: null })} title={t("examplesTitle")}>
        <ExamplesPanel />
      </LedgerSheet>
    </>
  )
}
