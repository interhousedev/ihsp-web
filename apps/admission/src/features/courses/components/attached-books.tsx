"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useAttachedBooks, useBookMutations, useCourseCatalog, type AttachedBook } from "../api"
import { CatalogCard } from "./catalog-card"

/** Books a counselor recommended; shown to the student on the courses page. */
export function MyBooks() {
  const t = useT("courses")
  const books = useAttachedBooks()
  if (books.isPending || books.isError || books.data.items.length === 0) return null
  return (
    <section id="courses-books" className="flex scroll-mt-20 flex-col gap-3" aria-labelledby="courses-books-title">
      <div>
        <h2 id="courses-books-title" className="text-lg font-semibold">
          {t("books.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("books.hint")}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {books.data.items.map((item) => (
          <CatalogCard
            key={item.book.id}
            entry={item.book}
            action={item.note ? <span className="text-muted-foreground text-xs">{item.note}</span> : undefined}
          />
        ))}
      </ul>
    </section>
  )
}

function AttachedRow({ item, studentId }: { item: AttachedBook; studentId: string }) {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const { detach } = useBookMutations(studentId)
  return (
    <CatalogCard
      entry={item.book}
      action={
        <>
          {item.note ? <span className="text-muted-foreground text-xs">{item.note}</span> : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 md:min-h-9"
            disabled={detach.isPending}
            onClick={() =>
              detach.mutate(item.book.id, {
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            <Icons.trash aria-hidden className="size-4" />
            {t("books.detach")}
          </Button>
        </>
      }
    />
  )
}

/** Staff: attached books of a student, a title search over the library and attach with a note. */
export function StaffBooksPanel({ studentId }: { studentId: string }) {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const books = useAttachedBooks(studentId)
  const { attach } = useBookMutations(studentId)
  const [text, setText] = useState("")
  const [note, setNote] = useState("")
  const query = useDebounce(text.trim(), 250)
  const found = useCourseCatalog(query, "book", 8)
  const attached = new Set((books.data?.items ?? []).map((i) => i.book.id))

  function add(itemId: string) {
    attach.mutate(
      { itemId, note: note.trim() || null },
      {
        onSuccess: () => {
          setNote("")
          toast.success(t("books.attached"))
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="staff-books-title">
      <h3 id="staff-books-title" className="text-base font-semibold">
        {t("books.staffTitle")}
      </h3>
      {books.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : books.isError ? (
        <StateView state="error" error={books.error} onRetry={() => void books.refetch()} />
      ) : books.data.items.length === 0 ? (
        <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">{t("books.empty")}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {books.data.items.map((item) => (
            <AttachedRow key={item.book.id} item={item} studentId={studentId} />
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 rounded-card border p-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("books.search")}
          <Input type="search" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("books.note")}
          <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </label>
        {found.isError ? (
          <StateView state="error" error={found.error} onRetry={() => void found.refetch()} />
        ) : (
          <ul className="grid gap-3">
            {(found.data?.items ?? []).map((entry) => (
              <CatalogCard
                key={entry.id}
                entry={entry}
                action={
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-11 md:min-h-9"
                    disabled={attached.has(entry.id) || attach.isPending}
                    onClick={() => add(entry.id)}
                  >
                    <Icons.add aria-hidden className="size-4" />
                    {attached.has(entry.id) ? t("books.alreadyAttached") : t("books.attach")}
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
