"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { RequestConsultationButton } from "../../consultations/components/request-dialog"
import { ProofList } from "../../proofs/components/proof-list"
import { incompleteFields, useDeleteItem, useGradeItem, usePatchItem, type Item, type ItemKind, type Rewrite } from "../api"
import { formValid, ItemFields, toForm, toInput, type FormState } from "./item-fields"
import { InterviewPanel } from "./interview-panel"
import { MetricsEditor } from "./metrics-editor"
import { ItemOpportunity } from "./item-opportunity"
import { ItemGrades } from "./item-grades"
import { ReviewSection } from "./review-card"

const FIELD: Record<keyof Rewrite, keyof FormState> = {
  position: "title",
  org: "organization",
  description: "description",
}

/** The full editor of one item (fields, metrics, review, proofs); `onDeleted` runs after the item is removed. */
export function ItemEditor({ item, onDeleted }: { item: Item; onDeleted: () => void }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const patch = usePatchItem(item.id)
  const remove = useDeleteItem()
  const [form, setForm] = useState<FormState>(() => toForm(item))
  const [confirming, setConfirming] = useState(false)
  const grade = useGradeItem(item.id)
  const gradeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (gradeTimer.current) clearTimeout(gradeTimer.current)
    },
    [],
  )
  /** Re-grades once after a save that changed the title or description; quota and consent errors stay silent (the stale badge shows). */
  const scheduleGrade = (saved: Item) => {
    const changed = saved.title !== item.title || saved.description !== item.description
    if (!changed || !saved.grade_stale) return
    if (gradeTimer.current) clearTimeout(gradeTimer.current)
    gradeTimer.current = setTimeout(() => grade.mutate(undefined, { onError: () => undefined }), 1500)
  }

  return (
    <div className="flex flex-col gap-8">
      <ItemGrades item={item} tips large />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          const { certificate_entry_id: _linked, ...changes } = toInput(form, item.kind as ItemKind)
          patch.mutate({ ...changes, lock_version: item.lock_version }, { onSuccess: scheduleGrade })
        }}
      >
        <ItemFields
          kind={item.kind as ItemKind}
          idPrefix="edit"
          value={form}
          onChange={setForm}
          errors={incompleteFields(patch.error)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={!formValid(form) || patch.isPending}>
            {t("form.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
            <Icons.trash aria-hidden />
            {t("delete.button")}
          </Button>
          {patch.isSuccess ? (
            <span role="status" className="text-muted-foreground text-sm">
              {t("saved")}
            </span>
          ) : null}
          {patch.isError && incompleteFields(patch.error).length === 0 ? (
            <span role="alert" className="text-destructive text-sm">
              {errorMessage(patch.error)}
            </span>
          ) : null}
        </div>
      </form>
      <InterviewPanel itemId={item.id} onApply={(field, value) => setForm((f) => ({ ...f, [FIELD[field]]: value }))} />
      <MetricsEditor key={item.lock_version} itemId={item.id} metrics={item.metrics} />
      {item.kind === "activity" ? <ItemOpportunity item={item} /> : null}
      <ReviewSection itemId={item.id} review={item.review} stale={item.review_stale} />
      <ProofList itemId={item.id} />
      <div>
        <RequestConsultationButton link={{ kind: "activity", id: item.id }} />
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("delete.title")}
        description={t("delete.text")}
        confirmLabel={t("delete.button")}
        destructive
        onConfirm={() => remove.mutate(item.id, { onSuccess: onDeleted })}
      />
    </div>
  )
}
