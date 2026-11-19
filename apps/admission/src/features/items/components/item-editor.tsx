"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useState } from "react"
import { RequestConsultationButton } from "../../consultations/components/request-dialog"
import { ProofList } from "../../proofs/components/proof-list"
import { incompleteFields, useDeleteItem, usePatchItem, type Item, type ItemKind, type Rewrite } from "../api"
import { formValid, ItemFields, toForm, toInput, type FormState } from "./item-fields"
import { InterviewPanel } from "./interview-panel"
import { MetricsEditor } from "./metrics-editor"
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

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          patch.mutate({ ...toInput(form), lock_version: item.lock_version })
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
      <ItemGrades item={item} tips />
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
