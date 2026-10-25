"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useLibraryAccess } from "../hooks/use-library-access"
import { BookEditor } from "../manage/editor/book-editor"

/**
 * `/upload/`: the book editor of `/manage/books/edit/` for everyone. A librarian creates the book directly; anyone
 * else fills in the same form and it is sent as a suggestion (a pending book request with its files), which a
 * librarian approves or declines. `?title=` prefills the title.
 */
export function UploadBookPage() {
  const t = useT("library.upload.suggest")
  const access = useLibraryAccess()
  const title = useSearchParams().get("title") ?? ""
  if (access.status === "loading") {
    return (
      <PageContainer title={t("title")}>
        <StateView state="loading" rows={4} />
      </PageContainer>
    )
  }
  return <BookEditor id={null} initialTitle={title} mode={access.isLibrarian ? "manage" : "suggest"} />
}
