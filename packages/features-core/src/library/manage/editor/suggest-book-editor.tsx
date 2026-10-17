"use client"

import { keys, postSuggestion, type FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, PageContainer, Textarea, buttonVariants } from "@ihsp/ui"
import { IconArrowLeft } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { myHref, uploadMaterialHref } from "../../utils/hrefs"
import { BookFileSection } from "./book-file-section"
import { emptyForm, suggestedFromForm, sameForm, type BookForm } from "./book-form"
import { validateForm } from "./book-form-checks"
import { BookMetadataFields } from "./book-metadata-fields"
import { BookSubjectsTopics } from "./book-subjects-topics"
import { FieldRow } from "./field-row"
import { formatOf, type PendingFile } from "./use-book-editor"
import { useLeaveGuard } from "./use-leave-guard"

const NOTE_MAX = 500

/** An address a librarian can open: empty is fine (the link is optional), otherwise it must be http or https. */
export function isSuggestionLink(value: string): boolean {
  const text = value.trim()
  if (text === "") return true
  try {
    const url = new URL(text)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

/**
 * The book editor in "suggest" mode (`/upload/` for everyone who is not a librarian): the same file and cover,
 * details, subjects and topics as the librarian's editor, plus a link and a note. There are no rights or visibility;
 * Send stores a pending suggestion with the uploaded file (`POST /library/suggestions` with `book` and `file_id`),
 * never a book. A librarian opens it in the book editor, edits it and approves or declines it; the status shows in
 * My library > My suggestions.
 */
export function SuggestBookEditor({ initialTitle = "" }: { initialTitle?: string }) {
  const t = useT("library.upload.suggest")
  const editor = useT("library.manage.editor")
  const errorMessage = useErrorMessage()
  const ids = { link: useId(), note: useId() }
  const [form, setForm] = useState<BookForm>(() => emptyForm(initialTitle))
  const [link, setLink] = useState("")
  const [note, setNote] = useState("")
  const [file, setFile] = useState<PendingFile | null>(null)
  const [coverName, setCoverName] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  const dirty = !sameForm(form, emptyForm(initialTitle)) || link !== "" || note !== "" || file !== null
  useLeaveGuard(dirty, editor("leaveConfirm"))

  const issues = useMemo(() => validateForm(form), [form])
  const linkInvalid = !isSuggestionLink(link)
  const blocked = Object.keys(issues).length > 0 || form.title.trim() === "" || form.authors.length === 0

  function update(patch: Partial<BookForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  const send = useMutation({
    mutationFn: () =>
      postSuggestion({
        title: form.title.trim(),
        book: suggestedFromForm(form),
        ...(link.trim() ? { url: link.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(file ? { file_id: file.id } : {}),
      }),
    onSuccess: async () => {
      toast.success(t("thanks"), {
        action: { label: t("mySuggestions"), onClick: () => router.push(myHref("suggestions")) },
      })
      setForm(emptyForm())
      setLink("")
      setNote("")
      setFile(null)
      setCoverName(null)
      setAttempted(false)
      await queryClient.invalidateQueries({ queryKey: keys.library.mySuggestions() })
    },
  })

  return (
    <PageContainer
      title={t("title")}
      actions={
        <>
          <Link
            href={myHref("suggestions")}
            className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
          >
            <IconArrowLeft aria-hidden />
            {t("mySuggestions")}
          </Link>
          <Link
            href={uploadMaterialHref()}
            className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
          >
            {t("materialInstead")}
          </Link>
        </>
      }
    >
      <form
        className="flex max-w-4xl flex-col gap-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setAttempted(true)
          if (!send.isPending && !blocked && !linkInvalid) send.mutate()
        }}
      >
        <p className="text-muted-foreground text-sm">{t("intro")}</p>

        <BookFileSection
          form={form}
          files={[]}
          pendingFile={file}
          coverName={coverName}
          attaching={false}
          attachError={null}
          disabled={send.isPending}
          bookPurpose="library_material"
          coverPurpose="library_material"
          onFile={(uploaded: FileItem) =>
            setFile({ id: uploaded.id, name: uploaded.name, format: formatOf(uploaded.name) })
          }
          onCover={(uploaded: FileItem) => {
            setCoverName(uploaded.name)
            update({ coverFileId: uploaded.id, coverUrl: null })
          }}
        />

        <section aria-labelledby="suggest-details-title" className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 id="suggest-details-title" className="text-lg font-semibold">
            {editor("metadata")}
          </h2>
          <BookMetadataFields form={form} issues={issues} disabled={send.isPending} onChange={update} />
        </section>

        <section aria-labelledby="suggest-subjects-title" className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 id="suggest-subjects-title" className="text-lg font-semibold">
            {editor("subjectsAndTopics")}
          </h2>
          <BookSubjectsTopics form={form} issues={issues} disabled={send.isPending} onChange={update} mode="suggest" />
        </section>

        <section aria-labelledby="suggest-source-title" className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 id="suggest-source-title" className="text-lg font-semibold">
            {t("sourceTitle")}
          </h2>
          <FieldRow
            id={ids.link}
            label={t("linkLabel")}
            hint={t("linkHint")}
            error={attempted && linkInvalid ? t("linkInvalid") : undefined}
          >
            <Input
              id={ids.link}
              type="url"
              inputMode="url"
              value={link}
              placeholder="https://"
              aria-invalid={attempted && linkInvalid}
              className="min-h-11 md:min-h-8"
              onChange={(event) => setLink(event.target.value)}
            />
          </FieldRow>
          <FieldRow id={ids.note} label={t("noteLabel")} hint={t("noteHint", { count: note.length, max: NOTE_MAX })}>
            <Textarea
              id={ids.note}
              rows={3}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FieldRow>
        </section>

        {send.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(send.error)}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" className="min-h-11 md:min-h-8" disabled={send.isPending || blocked}>
            {t("send")}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
