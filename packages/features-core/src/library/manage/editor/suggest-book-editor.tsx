"use client"

import { postSuggestion } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, PageContainer, Textarea, buttonVariants } from "@ihsp/ui"
import { IconArrowLeft } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { uploadHref } from "../../utils/hrefs"
import { emptyForm, suggestedFromForm, sameForm, type BookForm } from "./book-form"
import { validateForm } from "./book-form-checks"
import { BookMetadataFields } from "./book-metadata-fields"
import { BookSubjectsTopics } from "./book-subjects-topics"
import { FieldRow } from "./field-row"
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
 * The book editor in "suggest" mode (`/upload/suggest/`): the same details, subjects and topics as the librarian's
 * editor, plus a link and a note. There are no files, rights or visibility; Send puts the book into the librarians'
 * queue (`POST /library/suggestions` with `book`), where a librarian turns it into a draft.
 */
export function SuggestBookEditor({ initialTitle = "" }: { initialTitle?: string }) {
  const t = useT("library.upload.suggest")
  const editor = useT("library.manage.editor")
  const errorMessage = useErrorMessage()
  const ids = { link: useId(), note: useId() }
  const [form, setForm] = useState<BookForm>(() => emptyForm(initialTitle))
  const [link, setLink] = useState("")
  const [note, setNote] = useState("")
  const [attempted, setAttempted] = useState(false)
  const dirty = !sameForm(form, emptyForm(initialTitle)) || link !== "" || note !== ""
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
      }),
    onSuccess: () => {
      toast.success(t("thanks"))
      setForm(emptyForm())
      setLink("")
      setNote("")
      setAttempted(false)
    },
  })

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Link href={uploadHref()} className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}>
          <IconArrowLeft aria-hidden />
          {editor("back")}
        </Link>
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
