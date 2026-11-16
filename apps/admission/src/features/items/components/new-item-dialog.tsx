"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { incompleteFields, useCreateItem, type ItemKind } from "../api"
import { emptyForm, formValid, ItemFields, toInput, type FormState } from "./item-fields"

export function NewItemDialog({
  kind,
  open,
  onOpenChange,
  onCreated,
}: {
  kind: ItemKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const create = useCreateItem()
  const [form, setForm] = useState<FormState>(emptyForm)
  const missing = incompleteFields(create.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      { kind, ...toInput(form) },
      {
        onSuccess: (item) => {
          setForm(emptyForm)
          onOpenChange(false)
          onCreated?.(item.id)
        },
      },
    )
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(`new.${kind}`)}
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={!formValid(form) || create.isPending}>
          {t("new.create")}
        </Button>
      }
    >
      <ItemFields kind={kind} idPrefix="new" value={form} onChange={setForm} errors={missing} />
      {create.isError && missing.length === 0 ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
