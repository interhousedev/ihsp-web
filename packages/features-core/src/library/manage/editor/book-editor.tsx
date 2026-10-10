"use client"

import { useReasonText } from "../../upload/reason-text"
import { isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, PageContainer, StateView, buttonVariants } from "@ihsp/ui"
import { IconArrowLeft, IconExternalLink } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { NotAvailable } from "../../catalog/not-available"
import { itemHref, manageBooksHref } from "../../utils/hrefs"
import { BookActions } from "./book-actions"
import { BookFileSection } from "./book-file-section"
import { BookMetadataFields } from "./book-metadata-fields"
import { BookSubjectsTopics } from "./book-subjects-topics"
import { PublishChecklist } from "./publish-checklist"
import { RightsPanel } from "./rights-panel"
import { useBookEditor } from "./use-book-editor"

/**
 * The book editor (§ 3.4, § 9.2): file and cover, metadata, subjects and topics with page ranges, the rights panel,
 * visibility and download, the publish checklist, and Save, Publish, Unpublish and Take down. `id === null` is a new
 * book (`initialTitle` prefills the title, for a draft started from a suggestion).
 */
export function BookEditor({ id, initialTitle = "" }: { id: string | null; initialTitle?: string }) {
  const t = useT("library.manage.editor")
  const status = useT("library.item.status")
  const reasonText = useReasonText()
  const [today] = useState(() => new Date())
  const editor = useBookEditor(id, initialTitle, today)
  const [coverName, setCoverName] = useState<string | null>(null)

  if (id !== null && editor.loading) {
    return (
      <PageContainer title={t("editTitle")}>
        <StateView state="loading" rows={4} />
      </PageContainer>
    )
  }
  if (id !== null && editor.loadError) {
    if (isApiError(editor.loadError) && editor.loadError.status === 404) return <NotAvailable />
    return (
      <PageContainer title={t("editTitle")}>
        <StateView state="error" error={editor.loadError} onRetry={() => void editor.refetch()} />
      </PageContainer>
    )
  }

  const { form, update, issues, draft } = editor
  const state = draft?.item.status ?? null
  const busy = editor.save.isPending || editor.act.isPending
  const published = state === "published" || state === "held"

  return (
    <PageContainer
      title={id ? form.title || t("editTitle") : t("newTitle")}
      description={t("pageDescription")}
      actions={
        <>
          <Link
            href={manageBooksHref()}
            className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
          >
            <IconArrowLeft aria-hidden />
            {t("back")}
          </Link>
          {draft?.item.id && published ? (
            <Link
              href={itemHref(draft.item.id)}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              <IconExternalLink aria-hidden />
              {t("viewPublic")}
            </Link>
          ) : null}
        </>
      }
    >
      <form
        className="flex max-w-4xl flex-col gap-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy && !editor.blocked && (editor.dirty || id === null)) editor.save.mutate()
        }}
      >
        {state ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("statusLabel")}:</span>
            <Badge variant={state === "published" ? "default" : "secondary"}>{status(state)}</Badge>
            {draft?.item.status_reason ? (
              <span className="text-muted-foreground">
                {t("reason")}: {reasonText(draft.item.status_reason)}
              </span>
            ) : null}
          </p>
        ) : null}

        <BookFileSection
          form={form}
          files={editor.files}
          pendingFile={editor.pendingFile}
          coverName={coverName}
          attaching={editor.attach.isPending}
          attachError={editor.attach.error}
          disabled={busy}
          onFile={editor.addFile}
          onCover={(file) => {
            setCoverName(file.name)
            update({ coverFileId: file.id, coverUrl: null })
          }}
        />

        <section aria-labelledby="book-details-title" className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 id="book-details-title" className="text-lg font-semibold">
            {t("metadata")}
          </h2>
          <BookMetadataFields form={form} issues={issues} disabled={busy} onChange={update} />
        </section>

        <section aria-labelledby="book-subjects-title" className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 id="book-subjects-title" className="text-lg font-semibold">
            {t("subjectsAndTopics")}
          </h2>
          <BookSubjectsTopics form={form} issues={issues} disabled={busy} onChange={update} />
        </section>

        <RightsPanel form={form} issues={issues} disabled={busy} today={today} onChange={update} />

        <PublishChecklist items={editor.checklist} missing={editor.missingFields} stale={editor.dirty && id !== null} />

        <BookActions
          status={state}
          isNew={id === null}
          dirty={editor.dirty}
          blocked={editor.blocked}
          saving={editor.save.isPending}
          acting={editor.act.isPending}
          saveError={editor.save.error}
          problem={editor.problem}
          onSave={() => editor.save.mutate()}
          onAction={(action, reason) => editor.act.mutate({ action, reason })}
        />
      </form>
    </PageContainer>
  )
}
