"use client"

import { keys, postAdminSubjectMaterial, type SubjectMaterialCreateBody, type SubjectMaterialKind } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { LibraryItemSearch } from "./library-item-search"

const KINDS: readonly SubjectMaterialKind[] = ["file", "link", "library_item"]
const MAX_TITLE = 255

function isKind(value: unknown): value is SubjectMaterialKind {
  return KINDS.some((kind) => kind === value)
}

type Target = {
  file: { id: string; name: string } | null
  url: string
  book: { id: string; title: string } | null
}

/** The request body, or null while the title or the target of the chosen kind is missing. */
function bodyOf(kind: SubjectMaterialKind, rawTitle: string, target: Target): SubjectMaterialCreateBody | null {
  const title = rawTitle.trim()
  if (title === "" || title.length > MAX_TITLE) return null
  if (kind === "file") return target.file ? { kind, title, file_id: target.file.id } : null
  if (kind === "link") return target.url.trim() === "" ? null : { kind, title, url: target.url.trim() }
  return target.book ? { kind, title, library_item_id: target.book.id } : null
}

/** "Add material": a file (uploaded here), a link or a library book, with a title. */
export function DefaultMaterialForm({ eduSubjectId }: { eduSubjectId: number }) {
  const t = useT("subjects.materials")
  const errorMessage = useErrorMessage()
  const ids = useId()
  const [kind, setKind] = useState<SubjectMaterialKind>("file")
  // `auto`: the title was taken from the picked file or book and the administrator has not typed their own yet.
  const [title, setTitle] = useState({ text: "", auto: false })
  const [file, setFile] = useState<Target["file"]>(null)
  const [url, setUrl] = useState("")
  const [book, setBook] = useState<Target["book"]>(null)

  const kindLabels: Record<SubjectMaterialKind, string> = {
    file: t("kind.file"),
    link: t("kind.link"),
    library_item: t("kind.library_item"),
  }

  const add = useAdminMutation({
    mutationFn: (body: SubjectMaterialCreateBody) => postAdminSubjectMaterial(eduSubjectId, body),
    invalidate: [keys.admin.subjectMaterials.all()],
    success: t("add.added"),
    inlineError: true,
    onSuccess: () => {
      setTitle({ text: "", auto: false })
      setFile(null)
      setUrl("")
      setBook(null)
    },
  })

  /** A picked file or book names the material until the administrator types a title of their own. */
  function suggestTitle(name: string) {
    setTitle((current) =>
      current.auto || current.text.trim() === "" ? { text: name.slice(0, MAX_TITLE), auto: true } : current,
    )
  }

  const body = bodyOf(kind, title.text, { file, url, book })

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (body) add.mutate(body)
      }}
    >
      <h3 className="text-sm font-medium">{t("add.heading")}</h3>
      <div className="flex flex-col gap-1.5">
        <span id={`${ids}-kind`} className="text-sm font-medium">
          {t("add.kind")}
        </span>
        <ToggleGroup
          value={[kind]}
          variant="outline"
          aria-labelledby={`${ids}-kind`}
          onValueChange={(values) => {
            const next = values[0]
            if (isKind(next)) {
              setKind(next)
              add.reset()
            }
          }}
        >
          {KINDS.map((value) => (
            <ToggleGroupItem key={value} value={value} className={`${TOUCH} px-3`}>
              {kindLabels[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {kind === "file" ? (
        <div className="flex flex-col gap-2">
          <FileUploadButton
            purpose="link"
            label={t("add.upload")}
            onUploaded={(uploaded) => {
              setFile({ id: uploaded.id, name: uploaded.name })
              suggestTitle(uploaded.name)
            }}
          />
          {file ? <p className="text-sm break-words">{t("add.fileChosen", { name: file.name })}</p> : null}
        </div>
      ) : null}

      {kind === "link" ? (
        <LabeledField label={t("add.urlLabel")} htmlFor={`${ids}-url`} required>
          <Input
            id={`${ids}-url`}
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            className={TOUCH}
            onChange={(event) => setUrl(event.target.value)}
          />
        </LabeledField>
      ) : null}

      {kind === "library_item" ? (
        <div className="flex flex-col gap-2">
          <LibraryItemSearch
            selectedId={book?.id ?? null}
            onSelect={(item) => {
              setBook({ id: item.id, title: item.title })
              suggestTitle(item.title)
            }}
          />
          {book ? <p className="text-sm break-words">{t("add.bookChosen", { title: book.title })}</p> : null}
        </div>
      ) : null}

      <LabeledField label={t("add.titleLabel")} htmlFor={`${ids}-title`} required>
        <Input
          id={`${ids}-title`}
          value={title.text}
          maxLength={MAX_TITLE}
          className={TOUCH}
          onChange={(event) => setTitle({ text: event.target.value, auto: false })}
        />
      </LabeledField>

      <Button type="submit" className={TOUCH} disabled={body === null || add.isPending}>
        <Icons.add aria-hidden />
        {t("add.submit")}
      </Button>
      {add.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(add.error)}
        </p>
      ) : null}
    </form>
  )
}
