"use client"

import { useSearchParams } from "next/navigation"
import { BookEditor } from "./book-editor"

/**
 * `/manage/books/edit/?id=`: the editor of one book; without `id` a new book, whose title can be prefilled with
 * `?title=` (the review queue links a suggestion this way). The editor is keyed by the id, so after the first save
 * (the URL gets the new id) it starts again from the saved book.
 */
export function BookEditorPage() {
  const params = useSearchParams()
  const id = params.get("id")
  return <BookEditor key={id ?? "new"} id={id} initialTitle={params.get("title") ?? ""} />
}
