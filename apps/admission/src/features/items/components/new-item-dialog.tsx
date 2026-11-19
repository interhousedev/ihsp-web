"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { incompleteFields, useCreateItem, type ItemKind } from "../api"
import { ActivityWizard } from "./activity-wizard"
import { emptyForm, toInput, type FormState } from "./item-fields"

export function NewItemDialog({
  kind,
  open,
  onOpenChange,
  onCreated,
  initial = emptyForm,
}: {
  kind: ItemKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
  /** Prefill, e.g. from a planned item. */
  initial?: FormState
}) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const create = useCreateItem()
  const [form, setForm] = useState<FormState>(initial)
  const [step, setStep] = useState(1)
  const missing = incompleteFields(create.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step < 3) return
    create.mutate(
      { kind, ...toInput(form) },
      {
        onSuccess: (item) => {
          setForm(emptyForm)
          setStep(1)
          onOpenChange(false)
          onCreated?.(item.id)
        },
      },
    )
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setStep(1)
        onOpenChange(next)
      }}
      title={t(`new.${kind}`)}
      onSubmit={submit}
    >
      <ActivityWizard kind={kind} value={form} onChange={setForm} onStepChange={setStep} />
      {create.isError && missing.length === 0 ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
