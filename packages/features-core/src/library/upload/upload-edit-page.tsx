"use client"

import { getLibraryItemQuery, getLibraryItemTextQuery, isApiError, type ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { NotAvailable } from "../catalog/not-available"
import { MaterialDetailsEditor } from "./details-editor"
import { kindOfItem } from "./material-values"
import { NotEditablePanel } from "./not-editable-panel"
import { UploadWizard } from "./upload-wizard"

/** Statuses in which the owner carries on with the whole wizard (files can be replaced and the item resubmitted). */
const WIZARD_STATUSES = ["draft", "changes_requested"]
/** Statuses in which the owner may still correct title, description, topics and the text of a note. */
const DETAILS_STATUSES = ["pending_review", "published", "held"]

function EditBody({ item }: { item: ItemDetail }) {
  const t = useT("library.upload")
  const markdown = kindOfItem(item) === "markdown"
  // The text of a note is not part of the item; it is read from the text endpoint before the editor opens.
  const text = useQuery({
    ...getLibraryItemTextQuery(item.id ?? ""),
    enabled: markdown && Boolean(item.id),
    retry: false,
  })

  // The wizard is chosen by the status the page opened with: submitting changes the status (and refetches the item),
  // and the wizard must stay to show its "sent for review" panel.
  const [openedWith] = useState(item.status)
  const wizard = WIZARD_STATUSES.includes(openedWith)
  const title = item.status === "changes_requested" ? t("resubmitTitle") : wizard ? t("continueTitle") : t("editTitle")

  if (!item.can.edit || !(wizard || DETAILS_STATUSES.includes(item.status))) {
    return (
      <PageContainer title={t("editTitle")}>
        <NotEditablePanel item={item} />
      </PageContainer>
    )
  }
  if (markdown && text.isPending) {
    return (
      <PageContainer title={title}>
        <StateView state="loading" />
      </PageContainer>
    )
  }
  if (markdown && text.isError) {
    return (
      <PageContainer title={title}>
        <StateView state="error" error={text.error} onRetry={() => void text.refetch()} />
      </PageContainer>
    )
  }
  const body = text.data?.pages.map((page) => page.text).join("\n\n") ?? ""
  return (
    <PageContainer title={title} description={item.title}>
      {wizard ? (
        <UploadWizard key={item.id} item={item} initialBody={body} />
      ) : (
        <MaterialDetailsEditor key={item.id} item={item} initialBody={body} />
      )}
    </PageContainer>
  )
}

/**
 * `/upload/edit/?id=`: carry on with a draft, fix an item the librarian sent back (the reviewer's message is shown,
 * then **Resubmit**), or correct the details of a published item. Anything the caller may not edit shows the
 * reviewer's message and the way to a new upload; an unknown id is "This item is not available".
 */
export function UploadEditPage() {
  const id = useSearchParams().get("id")
  const query = useQuery({ ...getLibraryItemQuery(id ?? ""), enabled: Boolean(id), retry: false })
  if (!id) return <NotAvailable />
  if (query.isPending) {
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="loading" />
      </div>
    )
  }
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 403)) return <NotAvailable />
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }
  if (query.data.kind !== "material") return <NotAvailable />
  return <EditBody item={query.data} />
}
