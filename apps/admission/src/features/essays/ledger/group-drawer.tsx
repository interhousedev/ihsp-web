"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { useEssayLabel } from "../components/supp-label"
import type { PromptRef } from "../flow/api"
import { groupLabel, groupWordLimit } from "../flow/group-label"
import { useMatchList, type MatchSlot } from "../flow/steps-api"
import { isOwed, type LedgerRow } from "./ledger-model"
import { LedgerSheet } from "./ledger-sheet"
import { ScoreDot } from "./ledger-row"
import { useStartEssay } from "./use-start-essay"

/** The slot of a supplemental prompt in its university's table; Common App prompts have no slot of their own. */
function slotOf(slots: Map<string, MatchSlot[]>, prompt: PromptRef): MatchSlot | undefined {
  if (!prompt.institution_id) return undefined
  return slots.get(prompt.institution_id)?.find((s) => s.slot === `supp:${prompt.position}`)
}

function PromptItem({ prompt, slot, dimmed }: { prompt: PromptRef; slot: MatchSlot | undefined; dimmed: boolean }) {
  const t = useT("essayLedger")
  const tf = useT("essayFlow")
  return (
    <li className={dimmed ? "flex min-w-0 flex-col gap-1 opacity-70" : "flex min-w-0 flex-col gap-1"}>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{prompt.institution_name}</span>
        {prompt.in_list ? <Pill tone="primary">{tf("map.inList")}</Pill> : null}
        {prompt.word_limit ? (
          <span className="text-muted-foreground text-xs">
            {tf(prompt.limit_unit === "words" ? "map.words" : "map.chars", { count: prompt.word_limit })}
          </span>
        ) : null}
        {prompt.required ? null : <span className="text-muted-foreground text-xs">{t("optional")}</span>}
      </span>
      <span className="text-muted-foreground text-sm break-words">{prompt.prompt}</span>
      {slot ? (
        <span className="flex items-center gap-1.5 text-xs">
          {slot.assigned ? <Icons.check aria-hidden className="text-success size-3.5" /> : null}
          {slot.assigned ? (
            <span className="min-w-0 truncate">“{slot.assigned.title}”</span>
          ) : (
            <span className="text-muted-foreground">{t("slotFree")}</span>
          )}
        </span>
      ) : null}
    </li>
  )
}

/** The drawer of one ledger row: the prompts the essay answers with limits and slots, the essays already written, the way to start one. */
export function GroupDrawer({ row, onClose }: { row: LedgerRow | null; onClose: () => void }) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const { label } = useEssayLabel()
  const match = useMatchList()
  const { start, pending } = useStartEssay()
  const slots = useMemo(() => new Map((match.data?.items ?? []).map((m) => [m.institution_id, m.slots])), [match.data])
  const limit = row ? groupWordLimit(row.group) : null
  const owed = row ? row.group.prompts.filter(isOwed) : []
  const rest = row ? row.group.prompts.filter((p) => !isOwed(p)) : []
  return (
    <LedgerSheet
      open={row !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={row?.label ?? ""}
      description={row ? groupLabel({ ...row.group, prompts: owed.length ? owed : row.group.prompts }) : undefined}
    >
      {row ? (
        <div data-testid="group-drawer" className="flex flex-col gap-5">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span>{t("promptsCount", { count: row.group.prompts.length })}</span>
            {limit ? <span>· {t("limitMin", { count: limit })}</span> : null}
            {row.due ? (
              <span>· {t(row.due.predicted ? "duePredicted" : "due", { date: formatDate(row.due.date) })}</span>
            ) : null}
          </div>

          <section className="flex flex-col gap-2" aria-labelledby="drawer-essays">
            <h3 id="drawer-essays" className="text-sm font-semibold">
              {t("drawerEssays")}
            </h3>
            {row.essays.length === 0 ? <p className="text-muted-foreground text-sm">{t("drawerNoEssays")}</p> : null}
            <ul className="flex flex-col gap-2">
              {row.essays.map((e) => (
                <li key={e.id} className="bg-card rounded-card flex min-w-0 items-center gap-3 border p-3">
                  {e.uniqueness !== null ? <ScoreDot value={e.uniqueness} /> : null}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{label(e)}</span>
                    <span className="text-muted-foreground text-xs">
                      {e.word_limit ? te("wordsOf", { count: e.word_count, limit: e.word_limit }) : te("words", { count: e.word_count })}
                      {e.forked_from ? ` · ${t("forked")}` : ""}
                    </span>
                  </span>
                  <Link href={`/essays/edit/?id=${encodeURIComponent(e.id)}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    {t("open")}
                  </Link>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="self-start"
              variant={row.essays.length ? "outline" : "default"}
              disabled={pending}
              onClick={() => start(row.group, row.label)}
            >
              <Icons.add aria-hidden />
              {t(row.essays.length ? "startAnother" : "startEssay")}
            </Button>
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="drawer-prompts">
            <h3 id="drawer-prompts" className="text-sm font-semibold">
              {t("drawerPrompts")}
            </h3>
            <ul className="flex flex-col gap-4">
              {owed.map((p) => (
                <PromptItem key={p.key} prompt={p} slot={slotOf(slots, p)} dimmed={false} />
              ))}
            </ul>
            {rest.length > 0 ? (
              <>
                <p className="text-muted-foreground text-xs font-medium">{t("alsoFits")}</p>
                <ul className="flex flex-col gap-4">
                  {rest.map((p) => (
                    <PromptItem key={p.key} prompt={p} slot={undefined} dimmed />
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </LedgerSheet>
  )
}
