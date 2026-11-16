"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, PageHeader, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { HelpRequestButton } from "../../help/components/help-request-dialog"
import { ProofList } from "../../help/components/proof-list"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useDeleteItem, useItem, usePatchItem, type Item, type Rewrite } from "../api"
import { formValid, ItemFields, toInput, type FormState } from "./item-fields"
import { InterviewPanel } from "./interview-panel"
import { MetricsEditor } from "./metrics-editor"
import { ReviewSection } from "./review-card"

const toForm = (item: Item): FormState => ({
  title: item.title,
  organization: item.organization,
  description: item.description,
  category: item.category ?? "",
  grades: item.grades,
  hours: item.hours_per_week?.toString() ?? "",
  weeks: item.weeks_per_year?.toString() ?? "",
})

const FIELD: Record<keyof Rewrite, keyof FormState> = {
  position: "title",
  org: "organization",
  description: "description",
}

function Editor({ item }: { item: Item }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const patch = usePatchItem(item.id)
  const remove = useDeleteItem()
  const [form, setForm] = useState<FormState>(() => toForm(item))
  const [confirming, setConfirming] = useState(false)
  const back = `/activities/?kind=${item.kind}`

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
      <PageHeader title={item.title} />
      <Link
        href={back}
        className="text-muted-foreground flex min-h-11 w-fit items-center gap-1 text-sm hover:underline"
      >
        <Icons.chevronLeft aria-hidden className="size-4" />
        {t(`tabs.${item.kind === "honor" ? "honor" : "activity"}`)}
      </Link>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          patch.mutate({ ...toInput(form), lock_version: item.lock_version })
        }}
      >
        <ItemFields idPrefix="edit" value={form} onChange={setForm} />
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
          {patch.isError ? (
            <span role="alert" className="text-destructive text-sm">
              {errorMessage(patch.error)}
            </span>
          ) : null}
        </div>
      </form>
      <InterviewPanel itemId={item.id} onApply={(field, value) => setForm((f) => ({ ...f, [FIELD[field]]: value }))} />
      <MetricsEditor key={item.lock_version} itemId={item.id} metrics={item.metrics} />
      <ReviewSection itemId={item.id} review={item.review} stale={item.review_stale} />
      <ProofList itemId={item.id} />
      <div>
        <HelpRequestButton itemId={item.id} />
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("delete.title")}
        description={t("delete.text")}
        confirmLabel={t("delete.button")}
        destructive
        onConfirm={() => remove.mutate(item.id, { onSuccess: () => router.push(back) })}
      />
    </div>
  )
}

/** The editor of one item, `?id=`. */
export function ItemEditorPage() {
  const id = useSearchParams().get("id")
  const item = useItem(id)
  return (
    <AdmissionShell>
      {item.isPending ? <StateView state="loading" /> : null}
      {item.isError ? <StateView state="error" error={item.error} onRetry={() => item.refetch()} /> : null}
      {item.isSuccess && !item.data ? <StateView state="empty" icon={<Icons.sparkles aria-hidden />} /> : null}
      {item.data ? <Editor key={item.data.id} item={item.data} /> : null}
    </AdmissionShell>
  )
}
