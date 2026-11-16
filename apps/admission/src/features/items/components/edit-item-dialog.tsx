"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { incompleteFields, usePatchItem, type Item, type ItemKind } from "../api"
import { formValid, ItemFields, toForm, toInput, type FormState } from "./item-fields"

/** Edits one item in place; marking it ready shows the missing fields next to their inputs. */
export function EditItemDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const patch = usePatchItem(item.id)
  const [form, setForm] = useState<FormState>(() => toForm(item))
  const missing = incompleteFields(patch.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    patch.mutate({ ...toInput(form), lock_version: item.lock_version }, { onSuccess: onClose })
  }
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("edit.title")}
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={!formValid(form) || patch.isPending}>
          {t("form.save")}
        </Button>
      }
    >
      <ItemFields kind={item.kind as ItemKind} idPrefix="edit" value={form} onChange={setForm} errors={missing} />
      {patch.isError && missing.length === 0 ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {errorMessage(patch.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
