"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  buttonVariants,
  cn,
  Icons,
  Pill,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StateView,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useList } from "../../chooser/hooks"
import {
  type MatchCandidate,
  type MatchSlot,
  type TopEssay,
  useAssignSlot,
  useMatchTable,
  useTopEssays,
} from "./steps-api"
import { Section, StepHead, StepNext } from "./step-parts"
import { useDragAssign } from "./use-drag-assign"

function TopEssays() {
  const t = useT("essayFlow")
  const te = useT("essays")
  const top = useTopEssays()
  const items: TopEssay[] = top.data?.items ?? []
  return (
    <Section title={t("match.top")} hint={t("match.topHint")}>
      {top.isPending ? <Skeleton className="h-16 w-full" /> : null}
      {top.isError ? <StateView state="error" error={top.error} onRetry={() => void top.refetch()} /> : null}
      {top.isSuccess && items.length === 0 ? <p className="text-muted-foreground text-sm">{t("match.topEmpty")}</p> : null}
      {items.length > 0 ? (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e, i) => (
            <li key={e.essay_id} className="bg-card border-hairline rounded-card flex min-w-0 items-center gap-3 border p-3">
              <span className="text-muted-foreground w-5 text-center text-sm font-semibold tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title || te("untitled")}</p>
                <p className="text-muted-foreground text-xs">
                  {te(`kind.${e.kind}` as "kind.other")} · {te("words", { count: e.word_count })}
                </p>
              </div>
              <span className="text-lg font-semibold tabular-nums" title={e.band}>
                {e.score}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </Section>
  )
}

function Candidate({
  c,
  slot,
  wordLimit,
  onPointerDown,
  onAssign,
  busy,
}: {
  c: MatchCandidate
  slot: string
  wordLimit: number | null
  onPointerDown: React.PointerEventHandler
  onAssign: () => void
  busy: boolean
}) {
  const t = useT("essayFlow")
  const te = useT("essays")
  const over = wordLimit ? c.word_count - wordLimit : 0
  return (
    <li>
      <button
        type="button"
        data-testid={`candidate-${slot}-${c.essay_id}`}
        disabled={busy}
        onPointerDown={onPointerDown}
        onClick={onAssign}
        aria-label={t("match.assignAria", { title: c.title || te("untitled") })}
        className="bg-background hover:bg-accent border-hairline focus-visible:ring-ring flex w-full cursor-grab items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors select-none focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing disabled:opacity-60"
      >
        <Icons.add aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{c.title || te("untitled")}</span>
          <span className="text-muted-foreground block text-xs">{te("words", { count: c.word_count })}</span>
        </span>
        {over > 0 ? <Pill tone="warning">{t("match.overLimit", { count: over })}</Pill> : null}
        {c.target_match ? <Pill tone="primary">{t("match.targeted")}</Pill> : null}
        {c.alignment !== null ? (
          <Pill tone={c.alignment >= 70 ? "success" : c.alignment >= 40 ? "neutral" : "warning"}>
            {t("match.alignment", { value: c.alignment })}
          </Pill>
        ) : null}
      </button>
    </li>
  )
}

function SlotCard({
  slot,
  active,
  droppable,
  title,
  busy,
  onPointerDown,
  onAssign,
  onClear,
}: {
  slot: MatchSlot
  active: boolean
  droppable: boolean
  title: (essayId: string) => string
  busy: boolean
  onPointerDown: (essayId: string, title: string) => React.PointerEventHandler
  onAssign: (essayId: string) => void
  onClear: () => void
}) {
  const t = useT("essayFlow")
  const te = useT("essays")
  const isPs = slot.slot === "ps"
  const label = isPs ? t("match.slotPs") : t("match.slotSupp", { n: Number(slot.slot.split(":")[1] ?? 0) + 1 })
  const assigned = slot.essay_id
  const rest = slot.candidates.filter((c) => c.essay_id !== assigned)
  return (
    <li
      data-drop-slot={slot.slot}
      data-testid={`slot-${slot.slot}`}
      className={cn(
        "bg-card border-hairline rounded-card flex min-w-0 flex-col gap-3 border p-4 transition-colors",
        droppable && "border-primary/60 bg-primary/5 border-dashed",
        active && "border-primary bg-primary/10 ring-primary/40 ring-2",
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold">{label}</h4>
          {slot.word_limit ? <Pill>{t("match.limit", { count: slot.word_limit })}</Pill> : null}
        </div>
        {slot.prompt ? <p className="text-muted-foreground mt-1 text-xs italic">{slot.prompt}</p> : null}
      </div>

      {assigned ? (
        <div
          data-testid={`assigned-${slot.slot}`}
          className="border-success/40 bg-success-muted/40 flex items-center gap-2 rounded-md border px-3 py-2"
        >
          <Icons.check aria-hidden className="text-success size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{title(assigned) || te("untitled")}</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={onClear} aria-label={t("match.clearAria", { title: title(assigned) })}>
            <Icons.close aria-hidden />
            {t("match.clear")}
          </Button>
        </div>
      ) : (
        <p
          className={cn(
            "text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center text-xs",
            active && "border-primary text-primary",
          )}
        >
          {t("match.dropHere")}
        </p>
      )}

      {rest.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs">{t("match.candidates")}</p>
          <ul className="flex flex-col gap-1.5">
            {rest.map((c) => (
              <Candidate
                key={c.essay_id}
                c={c}
                slot={slot.slot}
                wordLimit={slot.word_limit}
                busy={busy}
                onPointerDown={onPointerDown(c.essay_id, c.title || te("untitled"))}
                onAssign={() => onAssign(c.essay_id)}
              />
            ))}
          </ul>
        </div>
      ) : assigned ? null : (
        <p className="text-muted-foreground text-xs">{t("match.noCandidates")}</p>
      )}
    </li>
  )
}

function Table({ universityId }: { universityId: string }) {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const table = useMatchTable(universityId)
  const assign = useAssignSlot(universityId)
  const slots = table.data?.slots ?? []
  const titleOf = (essayId: string) =>
    slots.flatMap((s) => s.candidates).find((c) => c.essay_id === essayId)?.title ?? ""
  const dnd = useDragAssign({
    accepts: (slot, essayId) =>
      slots.find((s) => s.slot === slot)?.candidates.some((c) => c.essay_id === essayId) === true,
    onDrop: (slot, essayId) => assign.mutate({ slot, essayId }),
  })

  if (table.isPending) return <Skeleton className="h-64 w-full" />
  if (table.isError) return <StateView state="error" error={table.error} onRetry={() => void table.refetch()} />
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">{t("match.howTo")}</p>
      <ul className="grid gap-3 md:grid-cols-2" data-testid="match-slots">
        {slots.map((slot) => (
          <SlotCard
            key={slot.slot}
            slot={slot}
            busy={assign.isPending}
            active={dnd.over === slot.slot}
            droppable={dnd.drag !== null && dnd.over !== slot.slot && slot.candidates.some((c) => c.essay_id === dnd.drag?.essayId)}
            title={titleOf}
            onPointerDown={dnd.start}
            onAssign={(essayId) => {
              if (!dnd.consumeClick()) assign.mutate({ slot: slot.slot, essayId })
            }}
            onClear={() => assign.mutate({ slot: slot.slot, essayId: null })}
          />
        ))}
      </ul>
      {assign.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(assign.error)}
        </p>
      ) : null}
      {dnd.drag ? (
        <div
          aria-hidden
          className="bg-card border-primary pointer-events-none fixed z-50 max-w-60 truncate rounded-md border px-3 py-2 text-sm font-medium shadow-lg"
          style={{ left: dnd.drag.x + 12, top: dnd.drag.y + 12 }}
        >
          {dnd.drag.title}
        </div>
      ) : null}
    </div>
  )
}

/** Step 6: your best essays, then per university which essay goes into which slot. */
export function MatchStep({ onNext }: { onNext?: () => void }) {
  const t = useT("essayFlow")
  const list = useList()
  const [picked, setPicked] = useState("")
  const entries = (list.data ?? []).map((e) => e.institution)
  const current = picked || entries[0]?.id || ""
  return (
    <div className="flex flex-col gap-5" data-testid="match-step">
      <StepHead title={t("match.title")} intro={t("match.intro")} />
      <TopEssays />
      <Section title={t("match.byUni")} hint={t("match.byUniHint")}>
        {list.isPending ? <Skeleton className="h-9 w-full" /> : null}
        {list.isError ? <StateView state="error" error={list.error} onRetry={() => void list.refetch()} /> : null}
        {list.isSuccess && entries.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground text-sm">{t("match.noList")}</p>
            <Link href="/chooser/" className={buttonVariants({ size: "sm" })}>
              {t("match.noListLink")}
            </Link>
          </div>
        ) : null}
        {entries.length > 0 ? (
          <>
            <Select items={entries.map((u) => ({ value: u.id, label: u.name }))} value={current} onValueChange={(next) => next && setPicked(next)}>
              <SelectTrigger aria-label={t("match.pickUni")} className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entries.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {current ? <Table key={current} universityId={current} /> : null}
          </>
        ) : null}
      </Section>
      <StepNext label={t("match.next")} onNext={onNext} />
    </div>
  )
}
