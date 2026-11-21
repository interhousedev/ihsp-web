"use client"

import { formatDate, useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons, Pill, ResponsiveDialog, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useEssays, type EssaySummary } from "../api"
import { useEssayLabel } from "../components/supp-label"
import { useAssignSlot, useMatchList, type MatchCandidate, type MatchSlot, type MatchTable } from "../flow/steps-api"
import { useDragAssign } from "../flow/use-drag-assign"

const dropId = (universityId: string, slot: string) => `${universityId}::${slot}`
const splitDrop = (id: string) => {
  const at = id.indexOf("::")
  return { universityId: id.slice(0, at), slot: id.slice(at + 2) }
}

function SlotName({ slot, index }: { slot: MatchSlot; index: number }) {
  const t = useT("essayFlow")
  return <>{slot.slot === "ps" ? t("match.slotPs") : t("match.slotSupp", { n: index })}</>
}

/** One slot of one university: filled with an essay, or an empty target that takes a drop or a tap. */
function SlotRow({
  table,
  slot,
  index,
  over,
  droppable,
  busy,
  onPick,
  onClear,
}: {
  table: MatchTable
  slot: MatchSlot
  index: number
  over: boolean
  droppable: boolean
  busy: boolean
  onPick: () => void
  onClear: () => void
}) {
  const t = useT("essayLedger")
  const tf = useT("essayFlow")
  const te = useT("essays")
  const a = slot.assigned
  return (
    <li
      data-drop-slot={dropId(table.institution_id, slot.slot)}
      data-testid={`slot-${table.institution_id}-${slot.slot}`}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-md border p-2.5 transition-colors",
        a ? "border-success/40 bg-success-muted/30" : "border-dashed",
        droppable && "border-primary/60 bg-primary/5",
        over && "border-primary bg-primary/10 ring-primary/40 ring-2",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className="font-semibold">
          <SlotName slot={slot} index={index} />
        </span>
        {slot.required ? <Pill tone="neutral" className="h-5 px-2 text-xs">{t("required")}</Pill> : <span className="text-muted-foreground">{t("optional")}</span>}
        {slot.word_limit ? <span className="text-muted-foreground">{tf("match.limit", { count: slot.word_limit })}</span> : null}
      </div>
      {slot.prompt ? <p className="text-muted-foreground line-clamp-2 text-xs italic">{slot.prompt}</p> : null}
      {a ? (
        <div className="flex min-w-0 items-center gap-2">
          <Icons.check aria-hidden className="text-success size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.title || te("untitled")}</span>
          {a.over_limit ? <Pill tone="warning" className="h-5 px-2 text-xs">{t("overLimit")}</Pill> : null}
          <Button type="button" size="icon-sm" variant="ghost" disabled={busy} onClick={onPick} aria-label={t("swapAria", { slot: slot.slot })}>
            <Icons.edit aria-hidden />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" disabled={busy} onClick={onClear} aria-label={tf("match.clearAria", { title: a.title })}>
            <Icons.close aria-hidden />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy || slot.candidates.length === 0}
          onClick={onPick}
          className="text-muted-foreground h-auto min-h-11 justify-start px-2 py-2 whitespace-normal md:min-h-9"
        >
          <Icons.add aria-hidden />
          {slot.candidates.length === 0 ? t("noCandidates") : t("assign")}
          <span className="hidden md:inline">{slot.candidates.length === 0 ? "" : ` · ${t("orDrop")}`}</span>
        </Button>
      )}
    </li>
  )
}

function Candidates({
  slot,
  onChoose,
}: {
  slot: MatchSlot
  onChoose: (c: MatchCandidate) => void
}) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const tf = useT("essayFlow")
  return (
    <ul className="flex flex-col gap-2">
      {slot.candidates.map((c) => {
        const over = slot.word_limit ? c.word_count - slot.word_limit : 0
        return (
          <li key={c.essay_id}>
            <button
              type="button"
              onClick={() => onChoose(c)}
              className="bg-card hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border p-3 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.title || te("untitled")}</span>
                <span className="text-muted-foreground block text-xs">{te("words", { count: c.word_count })}</span>
              </span>
              {over > 0 ? <Pill tone="warning">{tf("match.overLimit", { count: over })}</Pill> : null}
              {c.target_match ? <Pill tone="primary">{tf("match.targeted")}</Pill> : null}
              {c.alignment !== null ? <Pill tone={c.alignment >= 70 ? "success" : "neutral"}>{tf("match.alignment", { value: c.alignment })}</Pill> : null}
            </button>
          </li>
        )
      })}
      {slot.candidates.length === 0 ? <li className="text-muted-foreground text-sm">{t("noCandidates")}</li> : null}
    </ul>
  )
}

/** Essay chips to drag onto the slots of the board (a mouse or pen; a finger taps the slot instead). */
function Tray({ essays, onPointerDown }: { essays: EssaySummary[]; onPointerDown: (id: string, title: string) => React.PointerEventHandler }) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const { label } = useEssayLabel()
  if (essays.length === 0) return null
  return (
    <section aria-label={t("trayLabel")} className="hidden flex-col gap-2 md:flex">
      <p className="text-muted-foreground text-xs">{t("dragHint")}</p>
      <ul className="flex flex-wrap gap-2">
        {essays.map((e) => (
          <li key={e.id}>
            <span
              onPointerDown={onPointerDown(e.id, label(e))}
              data-testid={`tray-${e.id}`}
              className="bg-card hover:bg-accent flex cursor-grab items-center gap-2 rounded-full border px-3 py-1.5 text-sm select-none active:cursor-grabbing"
            >
              <Icons.gripVertical aria-hidden className="text-muted-foreground size-3.5" />
              <span className="max-w-48 truncate font-medium">{label(e)}</span>
              <span className="text-muted-foreground text-xs">{te("words", { count: e.word_count })}</span>
              {e.uniqueness !== null ? <span className="text-xs font-semibold tabular-nums">{e.uniqueness}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The "by university" lens: every listed university with its essay slots; drag an essay onto a slot on a desktop, tap a slot on a phone. */
export function UniBoard() {
  const t = useT("essayLedger")
  const errorMessage = useErrorMessage()
  const match = useMatchList()
  const essays = useEssays()
  const assign = useAssignSlot()
  const [picking, setPicking] = useState<{ universityId: string; slot: string } | null>(null)
  const tables = match.data?.items ?? []
  const slotAt = (universityId: string, slot: string) => tables.find((x) => x.institution_id === universityId)?.slots.find((s) => s.slot === slot)
  const dnd = useDragAssign({
    accepts: (id, essayId) => {
      const { universityId, slot } = splitDrop(id)
      return slotAt(universityId, slot)?.candidates.some((c) => c.essay_id === essayId) === true
    },
    onDrop: (id, essayId) => assign.mutate({ ...splitDrop(id), essayId }),
  })
  const pickSlot = picking ? slotAt(picking.universityId, picking.slot) : undefined
  const pickTable = picking ? tables.find((x) => x.institution_id === picking.universityId) : undefined

  if (match.isPending) return <Skeleton className="h-64 w-full" />
  if (match.isError) return <StateView state="error" error={match.error} onRetry={() => void match.refetch()} />
  if (tables.length === 0)
    return (
      <StateView
        state="empty"
        icon={<Icons.post aria-hidden />}
        title={t("boardEmptyTitle")}
        description={t("boardEmptyText")}
        action={
          <Link href="/chooser/" className={buttonVariants()}>
            {t("boardEmptyLink")}
          </Link>
        }
      />
    )
  return (
    <div className="flex flex-col gap-4" data-testid="uni-board">
      <Tray essays={essays.data?.items ?? []} onPointerDown={dnd.start} />
      <ul className="grid gap-3 md:grid-cols-2">
        {tables.map((table) => {
          const filled = table.slots.filter((s) => s.assigned).length
          return (
            <li key={table.institution_id} data-testid={`board-uni-${table.institution_id}`} className="bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3 md:p-4">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <h3 className="min-w-0 truncate font-semibold">{table.institution_name}</h3>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {t("slotsFilled", { done: filled, total: table.slots.length })}
                  {table.due_utc ? ` · ${t(table.due_predicted ? "duePredicted" : "due", { date: formatDate(table.due_utc) })}` : ""}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {table.slots.map((slot, i) => {
                  const index = table.slots.slice(0, i + 1).filter((s) => s.slot !== "ps").length
                  const id = dropId(table.institution_id, slot.slot)
                  return (
                    <SlotRow
                      key={slot.slot}
                      table={table}
                      slot={slot}
                      index={index}
                      busy={assign.isPending}
                      over={dnd.over === id}
                      droppable={dnd.drag !== null && dnd.over !== id && slot.candidates.some((c) => c.essay_id === dnd.drag?.essayId)}
                      onPick={() => setPicking({ universityId: table.institution_id, slot: slot.slot })}
                      onClear={() => assign.mutate({ universityId: table.institution_id, slot: slot.slot, essayId: null })}
                    />
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
      {assign.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(assign.error)}
        </p>
      ) : null}
      {dnd.drag ? (
        <div
          aria-hidden
          className="bg-card border-primary pointer-events-none fixed z-[70] max-w-60 truncate rounded-md border px-3 py-2 text-sm font-medium shadow-lg"
          style={{ left: dnd.drag.x + 12, top: dnd.drag.y + 12 }}
        >
          {dnd.drag.title}
        </div>
      ) : null}
      <ResponsiveDialog
        open={picking !== null && pickSlot !== undefined}
        onOpenChange={(open) => !open && setPicking(null)}
        title={pickTable && pickSlot ? t("pickTitle", { uni: pickTable.institution_name }) : ""}
        description={pickSlot?.prompt ?? undefined}
      >
        {pickSlot && picking ? (
          <Candidates
            slot={pickSlot}
            onChoose={(c) => {
              assign.mutate({ ...picking, essayId: c.essay_id }, { onSuccess: () => setPicking(null) })
            }}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  )
}
