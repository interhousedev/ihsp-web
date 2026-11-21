"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useCreateEssay, useEssays } from "../api"
import { useAssignCommonApp, useAssignSlot, useMatchList, type MatchSlot, type MatchTable } from "../flow/steps-api"
import { useDragAssign } from "../flow/use-drag-assign"
import { EssayPicker } from "./essay-picker"
import { EssayPreview } from "./essay-preview"
import { useEssayText } from "./essay-text"
import { EssayTray } from "./essay-tray"
import { useLedgerView } from "./ledger-state"
import { SlotCard, dropId } from "./slot-card"
import { blocker, isPersonalSlot, promptHead, slotPosition, splitTables } from "./slot-model"
import { UniDetail } from "./uni-detail"
import { UniList } from "./uni-list"

const splitDrop = (id: string) => {
  const at = id.indexOf("::")
  return { universityId: id.slice(0, at), slot: id.slice(at + 2) }
}

/**
 * The "by university" lens: a scrolling list of universities beside the slots of the chosen one (a phone shows the
 * list, then the detail). Each slot takes an essay by choice or, on a desktop, by dragging it from the sticky tray.
 */
export function UniBoard() {
  const t = useT("essayLedger")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const view = useLedgerView()
  const match = useMatchList()
  const essays = useEssays()
  const assignSlot = useAssignSlot()
  const assignCommon = useAssignCommonApp()
  const assign = {
    isPending: assignSlot.isPending || assignCommon.isPending,
    isError: assignSlot.isError || assignCommon.isError,
    error: assignSlot.error ?? assignCommon.error,
    mutate: (v: { universityId: string; slot: string; essayId: string | null }, o?: { onSuccess?: () => void }) =>
      slotAt(v.universityId, v.slot)?.shared ? assignCommon.mutate(v.essayId, o) : assignSlot.mutate(v, o),
  }
  const create = useCreateEssay()
  const text = useEssayText()
  const [picking, setPicking] = useState<{ universityId: string; slot: string } | null>(null)
  const [preview, setPreview] = useState<{ id: string; title: string; limit: number | null } | null>(null)
  const tables = match.data?.items ?? []
  const mine = essays.data?.items ?? []
  const first = splitTables(tables).active[0] ?? tables[0]
  const selected = tables.find((x) => x.institution_id === view.uni)
  const shown = selected ?? first
  const slotAt = (universityId: string, slot: string) =>
    tables.find((x) => x.institution_id === universityId)?.slots.find((s) => s.slot === slot)
  const canDrop = (_t: MatchTable, slot: MatchSlot, essayId: string) => {
    const e = mine.find((x) => x.id === essayId)
    return !!e && blocker(slot, e) === null
  }
  const dnd = useDragAssign({
    accepts: (id, essayId) => {
      const { universityId, slot } = splitDrop(id)
      const s = slotAt(universityId, slot)
      return !!s && canDrop(tables[0] as MatchTable, s, essayId)
    },
    onDrop: (id, essayId) => assign.mutate({ ...splitDrop(id), essayId }),
  })
  const sharedTable = tables.find((x) => x.slots.some((sl) => sl.shared))
  const shared = sharedTable?.slots.find((sl) => sl.shared)
  const pickSlot = picking ? slotAt(picking.universityId, picking.slot) : undefined
  const pickTable = picking ? tables.find((x) => x.institution_id === picking.universityId) : undefined

  const write = (table: MatchTable, slot: MatchSlot) => {
    const position = slotPosition(slot)
    const personal = isPersonalSlot(slot)
    create.mutate(
      {
        kind: personal ? "personal_statement" : "supplemental",
        title: personal ? "" : (promptHead(slot.prompt, 5) ?? ""),
        prompt_text: "",
        word_limit: slot.word_limit,
        targets: personal || position === null ? [] : [{ institution_id: table.institution_id, position }],
      },
      {
        onSuccess: (essay) => router.push(`/essays/edit/?id=${encodeURIComponent(essay.id)}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  if (match.isPending || essays.isPending) return <Skeleton className="h-64 w-full" />
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
  const onList = view.uni === null || !selected
  return (
    <div
      className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-4 md:h-full md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]"
      data-testid="uni-board"
    >
      <div
        className={cn(
          "bg-card rounded-card min-h-0 border md:overflow-y-auto md:[scrollbar-gutter:stable]",
          !onList && "max-md:hidden",
        )}
      >
        {sharedTable && shared ? (
          <ul className="border-hairline min-w-0 border-b p-2" data-testid="shared-slot">
            <SlotCard
              table={sharedTable}
              slot={shared}
              essay={mine.find((e) => e.id === shared.assigned?.essay_id)}
              busy={assign.isPending || create.isPending}
              over={dnd.over === dropId(sharedTable.institution_id, shared.slot)}
              droppable={
                dnd.drag !== null &&
                dnd.over !== dropId(sharedTable.institution_id, shared.slot) &&
                canDrop(sharedTable, shared, dnd.drag.essayId)
              }
              onPick={() => setPicking({ universityId: sharedTable.institution_id, slot: shared.slot })}
              onClear={() =>
                assign.mutate({ universityId: sharedTable.institution_id, slot: shared.slot, essayId: null })
              }
              onPreview={() =>
                shared.assigned &&
                setPreview({ id: shared.assigned.essay_id, title: shared.assigned.title, limit: shared.word_limit })
              }
              onCopy={() => shared.assigned && void text.copy(shared.assigned.essay_id)}
              onWrite={() => write(sharedTable, shared)}
            />
          </ul>
        ) : null}
        <UniList tables={tables} selectedId={shown?.institution_id ?? null} onSelect={(id) => view.set({ uni: id })} />
      </div>
      <div
        className={cn(
          "bg-card rounded-card flex min-h-0 min-w-0 flex-col overflow-hidden border",
          onList && "max-md:hidden",
        )}
      >
        {shown ? (
          <UniDetail
            table={shown}
            onBack={() => view.set({ uni: null })}
            h={{
              essays: mine,
              busy: assign.isPending || create.isPending,
              overId: dnd.over,
              dragEssayId: dnd.drag?.essayId ?? null,
              canDrop,
              onPick: (table, slot) => setPicking({ universityId: table.institution_id, slot }),
              onClear: (table, slot) => assign.mutate({ universityId: table.institution_id, slot, essayId: null }),
              onPreview: (id, title, limit) => setPreview({ id, title, limit }),
              onCopy: (id) => void text.copy(id),
              onWrite: write,
            }}
          />
        ) : null}
        <EssayTray essays={mine} onPointerDown={dnd.start} />
      </div>
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
      <EssayPicker
        slot={picking ? pickSlot : undefined}
        title={pickTable ? t("pickTitle", { uni: pickSlot?.shared ? t("commonApp") : pickTable.institution_name }) : ""}
        essays={mine}
        currentId={pickSlot?.essay_id ?? null}
        onClose={() => setPicking(null)}
        onChoose={(e) => picking && assign.mutate({ ...picking, essayId: e.id }, { onSuccess: () => setPicking(null) })}
      />
      <EssayPreview
        essayId={preview?.id ?? null}
        title={preview?.title ?? ""}
        limit={preview?.limit ?? null}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}
