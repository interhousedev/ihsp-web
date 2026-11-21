"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { useState } from "react"
import type { EssaySummary } from "../api"
import type { MatchTable } from "../flow/steps-api"
import { dropId, SlotCard } from "./slot-card"
import { filledCount, isShortSlot } from "./slot-model"
import { UniLogo } from "./uni-logo"

export type SlotHandlers = {
  essays: EssaySummary[]
  busy: boolean
  overId: string | null
  dragEssayId: string | null
  canDrop: (table: MatchTable, slot: MatchTable["slots"][number], essayId: string) => boolean
  onPick: (table: MatchTable, slot: string) => void
  onClear: (table: MatchTable, slot: string) => void
  onPreview: (essayId: string, title: string, limit: number | null) => void
  onCopy: (essayId: string) => void
  onWrite: (table: MatchTable, slot: MatchTable["slots"][number]) => void
}

/** The slots of one university: header with logo, deadline and count; Common App essay first; short answers folded in one group. */
export function UniDetail({ table, h, onBack }: { table: MatchTable; h: SlotHandlers; onBack: () => void }) {
  const t = useT("essayLedger")
  const [shortOpen, setShortOpen] = useState(false)
  const main = table.slots.filter((s) => !isShortSlot(s))
  const short = table.slots.filter(isShortSlot)
  const ordered = [...main].sort((a, b) => Number(b.slot === "ps") - Number(a.slot === "ps"))
  const card = (slot: MatchTable["slots"][number]) => {
    const id = dropId(table.institution_id, slot.slot)
    return (
      <SlotCard
        key={slot.slot}
        table={table}
        slot={slot}
        essay={h.essays.find((e) => e.id === slot.assigned?.essay_id)}
        busy={h.busy}
        over={h.overId === id}
        droppable={h.dragEssayId !== null && h.overId !== id && h.canDrop(table, slot, h.dragEssayId)}
        onPick={() => h.onPick(table, slot.slot)}
        onClear={() => h.onClear(table, slot.slot)}
        onPreview={() => slot.assigned && h.onPreview(slot.assigned.essay_id, slot.assigned.title, slot.word_limit)}
        onCopy={() => slot.assigned && h.onCopy(slot.assigned.essay_id)}
        onWrite={() => h.onWrite(table, slot)}
      />
    )
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="uni-detail">
      <header className="border-hairline flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Button type="button" variant="ghost" size="icon" className="-ml-2 size-11 md:hidden" onClick={onBack} aria-label={t("backToUnis")}>
          <Icons.chevronLeft aria-hidden />
        </Button>
        <UniLogo id={table.institution_id} name={table.institution_name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate font-semibold">{table.institution_name}</h3>
          <p className="text-muted-foreground text-xs">
            {table.due_utc ? `${t(table.due_predicted ? "duePredicted" : "due", { date: formatDate(table.due_utc, undefined, { day: "numeric", month: "short" }) })} · ` : ""}
            {t("slotsFilled", { done: filledCount(table), total: table.slots.length })}
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable]">
        {table.slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noSlots")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordered.map(card)}
            {short.length > 0 ? (
              <li className="flex flex-col gap-3">
                <button
                  type="button"
                  aria-expanded={shortOpen}
                  onClick={() => setShortOpen((v) => !v)}
                  className="text-muted-foreground flex min-h-9 items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                >
                  <Icons.chevronDown aria-hidden className={cn("size-4 transition-transform", !shortOpen && "-rotate-90")} />
                  {t("shortGroup", { count: short.length })}
                </button>
                {shortOpen ? <ul className="flex flex-col gap-3">{short.map(card)}</ul> : null}
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  )
}
