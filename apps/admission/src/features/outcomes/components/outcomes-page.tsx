"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Pill, Skeleton, StateView, Switch } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, PageSection, pageClass } from "../../../components/lib/page"
import { useInstitution } from "../../chooser/hooks"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useDeleteOutcome, useOutcomes, useOutcomeSummary, useUpdateOutcome, type Outcome } from "../api"
import { OutcomeDialog } from "./outcome-dialog"
import { OutcomeSummary } from "./outcome-summary"

const TONE = {
  accepted: "success",
  enrolled: "success",
  waitlisted: "warning",
  deferred: "warning",
  rejected: "danger",
  applied: "neutral",
} as const

function OutcomeRow({
  outcome,
  name,
  onEdit,
  onRemove,
}: {
  outcome: Outcome
  name: string
  onEdit: () => void
  onRemove: () => void
}) {
  const t = useT("outcomes")
  const errorMessage = useErrorMessage()
  const update = useUpdateOutcome()
  async function toggle(share: boolean) {
    try {
      await update.mutateAsync({ id: outcome.id, lock_version: outcome.lock_version, share_name: share })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }
  return (
    <li className="bg-card rounded-card flex flex-col gap-4 border p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="truncate text-sm font-semibold">{name || t("unknownUniversity")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={TONE[outcome.status as keyof typeof TONE] ?? "neutral"} className="h-6 px-2 text-xs">
            {t(`status.${outcome.status}`)}
          </Pill>
          <span className="text-muted-foreground text-xs">
            {t(`plan.${outcome.plan}`)} · {t("cycleValue", { cycle: outcome.cycle })}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <Switch checked={outcome.share_name} onCheckedChange={(value) => void toggle(value)} />
          {t("showName")}
        </label>
        <Button variant="outline" size="sm" className="min-h-11 md:min-h-8" onClick={onEdit}>
          <Icons.edit aria-hidden className="size-4" />
          {t("edit")}
        </Button>
        <Button variant="ghost" size="icon" className="size-11 md:size-8" aria-label={t("remove")} onClick={onRemove}>
          <Icons.trash aria-hidden className="size-4" />
        </Button>
      </div>
    </li>
  )
}

function MyOutcomes({ onAdd }: { onAdd: () => void }) {
  const t = useT("outcomes")
  const errorMessage = useErrorMessage()
  const mine = useOutcomes()
  const summary = useOutcomeSummary()
  const remove = useDeleteOutcome()
  const [editing, setEditing] = useState<Outcome | null>(null)
  const [removing, setRemoving] = useState<Outcome | null>(null)
  const names = new Map((summary.data?.items ?? []).map((tally) => [tally.institution_id, tally.institution_name]))
  if (mine.isPending) return <Skeleton className="h-24 w-full" />
  if (mine.isError) return <StateView state="error" error={mine.error} onRetry={() => void mine.refetch()} />
  const items = mine.data
  async function confirmRemove() {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      setRemoving(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }
  return (
    <>
      {items.length === 0 ? (
        <StateView state="empty" title={t("empty")} action={<Button onClick={onAdd}>{t("add")}</Button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((outcome) => (
            <OutcomeRow
              key={outcome.id}
              outcome={outcome}
              name={names.get(outcome.institution_id) ?? ""}
              onEdit={() => setEditing(outcome)}
              onRemove={() => setRemoving(outcome)}
            />
          ))}
        </ul>
      )}
      {editing ? (
        <OutcomeDialog
          key={editing.id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          outcome={editing}
          institutionName={names.get(editing.institution_id)}
        />
      ) : null}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("removeTitle")}
        confirmLabel={t("remove")}
        destructive
        onConfirm={() => void confirmRemove()}
      />
    </>
  )
}

/** Opens the add dialog for `?add=<institution id>&cycle=<year>` (the "add your result" nudge on the dashboard). */
function PresetDialog({ id, cycle, onClose }: { id: string; cycle?: number; onClose: () => void }) {
  const institution = useInstitution(id)
  if (!institution.data) return null
  const { name, country } = institution.data
  return (
    <OutcomeDialog
      open
      onOpenChange={(open) => !open && onClose()}
      preset={{ institution: { id, name, country }, cycle }}
    />
  )
}

export function OutcomesPage() {
  const t = useT("outcomes")
  const params = useSearchParams()
  const presetId = params.get("add")
  const presetCycle = Number(params.get("cycle")) || undefined
  const [adding, setAdding] = useState(false)
  const [presetOpen, setPresetOpen] = useState(true)
  return (
    <AdmissionShell>
      <div className={pageClass("default")}>
        <AppPageHeader
          icon="target"
          title={t("title")}
          actions={
            <Button onClick={() => setAdding(true)}>
              <Icons.add aria-hidden className="size-4" />
              {t("add")}
            </Button>
          }
        />
        <PageSection title={t("mine")}>
          <MyOutcomes onAdd={() => setAdding(true)} />
        </PageSection>
        <PageSection title={t("community")}>
          <OutcomeSummary />
        </PageSection>
        {adding ? <OutcomeDialog open onOpenChange={setAdding} /> : null}
        {presetId && presetOpen ? (
          <PresetDialog id={presetId} cycle={presetCycle} onClose={() => setPresetOpen(false)} />
        ) : null}
      </div>
    </AdmissionShell>
  )
}
