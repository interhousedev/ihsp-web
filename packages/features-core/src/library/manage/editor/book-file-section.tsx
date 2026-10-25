"use client"

import type { FileItem, ItemFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, formatBytes } from "@ihsp/ui"
import { IconCircleCheck } from "@ihsp/ui"
import { CoverImage } from "../../catalog/cover-image"
import type { BookForm } from "./book-form"
import type { PendingFile } from "./use-book-editor"
import { UploadZone } from "./upload-zone"

/** The book file (PDF or EPUB) and the cover: what is attached now, and a drop zone for each. */
export function BookFileSection({
  form,
  files,
  pendingFile,
  coverName,
  attaching,
  attachError,
  disabled,
  onFile,
  onCover,
  bookPurpose = "library_book",
  coverPurpose = "library_cover",
  bookExtensions = [".pdf", ".epub"],
}: {
  form: BookForm
  files: readonly ItemFile[]
  pendingFile: PendingFile | null
  coverName: string | null
  attaching: boolean
  attachError: unknown
  disabled: boolean
  onFile: (file: FileItem) => void
  onCover: (file: FileItem) => void
  /** Students upload with `library_material` (books and covers are librarians' purposes). */
  bookPurpose?: "library_book" | "library_material"
  coverPurpose?: "library_cover" | "library_material"
  bookExtensions?: string[]
}) {
  const t = useT("library.manage.editor")
  const status = useT("library.manage.textStatus")
  const errorMessage = useErrorMessage()
  return (
    <section
      aria-labelledby="book-file-title"
      className="grid gap-4 rounded-xl border p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <h2 id="book-file-title" className="text-lg font-semibold">
          {t("file")}
        </h2>
        {files.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {files.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium uppercase">{file.format}</span>
                {file.pages ? <span>{t("pages", { count: file.pages })}</span> : null}
                <span className="text-muted-foreground">{formatBytes(file.byte_size)}</span>
                <Badge variant={file.text_status === "ready" ? "secondary" : "outline"}>
                  {status(file.text_status)}
                </Badge>
                {file.is_primary ? <Badge variant="outline">{t("primaryFile")}</Badge> : null}
              </li>
            ))}
          </ul>
        ) : pendingFile ? null : (
          <p className="text-muted-foreground text-sm">{t("noFile")}</p>
        )}
        {pendingFile ? (
          <p className="text-sm">
            <IconCircleCheck className="me-1 inline size-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
            {t("filePending", { name: pendingFile.name })}
          </p>
        ) : null}
        <UploadZone
          purpose={bookPurpose}
          extensions={bookExtensions}
          label={t("file")}
          hint={files.length > 0 ? t("fileReplaceHint") : t("fileHint")}
          chooseLabel={files.length > 0 ? t("fileReplace") : t("fileChoose")}
          disabled={disabled || attaching}
          onUploaded={onFile}
        />
        {attachError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(attachError)}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("cover")}</h2>
        <CoverImage src={form.coverUrl} className="aspect-[3/4] w-28 rounded-md" />
        {coverName ? (
          <p className="text-sm">
            <IconCircleCheck className="me-1 inline size-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
            {t("coverNew", { name: coverName })}
          </p>
        ) : null}
        <UploadZone
          purpose={coverPurpose}
          extensions={[".jpg", ".jpeg", ".png", ".webp"]}
          label={t("cover")}
          hint={t("coverHint")}
          chooseLabel={form.coverFileId ? t("coverReplace") : t("coverChoose")}
          disabled={disabled}
          onUploaded={onCover}
        />
      </div>
    </section>
  )
}
