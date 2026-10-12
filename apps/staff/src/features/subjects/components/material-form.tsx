"use client"

import {
  getLibraryItemsQuery,
  postStaffSubjectMaterial,
  type StaffSubjectMaterialCreateBody,
  type SubjectMaterialKind,
} from "@ihsp/api"
import { DrivePicker } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, useDebounce } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"

const KINDS: readonly SubjectMaterialKind[] = ["file", "link", "library_item"]
const MAX_TITLE = 255

type Target = { file: { id: string; name: string } | null; url: string; book: { id: string; title: string } | null }

function bodyOf(kind: SubjectMaterialKind, rawTitle: string, target: Target): StaffSubjectMaterialCreateBody | null {
  const title = rawTitle.trim()
  if (title === "" || title.length > MAX_TITLE) return null
  if (kind === "file") return target.file ? { kind, title, file_id: target.file.id } : null
  if (kind === "link") return target.url.trim() === "" ? null : { kind, title, url: target.url.trim() }
  return target.book ? { kind, title, library_item_id: target.book.id } : null
}

function BookSearch({ onPick }: { onPick: (book: { id: string; title: string }) => void }) {
  const tAdd = useT("subjects.materials.add")
  const id = useId()
  const [text, setText] = useState("")
  const q = useDebounce(text.trim(), 250)
  const search = useQuery({ ...getLibraryItemsQuery({ q, limit: 8 }), enabled: q.length >= 2 })
  const results = (search.data?.items ?? []).filter((card) => card.kind !== "external" && card.id)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{tAdd("searchLabel")}</Label>
      <Input
        id={id}
        type="search"
        value={text}
        className="min-h-11 md:min-h-8"
        onChange={(e) => setText(e.target.value)}
      />
      {q.length >= 2 && results.length === 0 && !search.isPending ? (
        <p className="text-muted-foreground text-sm">{tAdd("searchNone")}</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {results.map((card) => (
          <li key={card.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
            <span className="min-w-0 break-words">{card.title}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => card.id && onPick({ id: card.id, title: card.title })}
            >
              {tAdd("pickBook")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * "Add material" for one tier: all the teacher's groups of the subject (no `group`), or one group (and subgroup). A
 * file is picked from the Drive-like picker (or uploaded there), a link is typed, a book is found in the library.
 */
export function MaterialForm({
  subjectId,
  group,
  heading,
}: {
  subjectId: string
  group?: { group_id: string; subgroup: number | null }
  heading: string
}) {
  const t = useT("subjects.materials")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const ids = useId()
  const kinds: Record<SubjectMaterialKind, string> = {
    file: t("kind.file"),
    link: t("kind.link"),
    library_item: t("kind.library_item"),
  }
  const [kind, setKind] = useState<SubjectMaterialKind>("file")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<Target["file"]>(null)
  const [url, setUrl] = useState("")
  const [book, setBook] = useState<Target["book"]>(null)
  const [drive, setDrive] = useState(false)

  const add = useMutation({
    mutationFn: (body: StaffSubjectMaterialCreateBody) =>
      postStaffSubjectMaterial(subjectId, {
        ...body,
        ...(group ? { group_id: group.group_id, subgroup: group.subgroup } : {}),
      }),
    onSuccess: async () => {
      setTitle("")
      setFile(null)
      setUrl("")
      setBook(null)
      await client.invalidateQueries({ queryKey: ["staff-subjects"] })
    },
  })
  const body = bodyOf(kind, title, { file, url, book })
  const suggest = (name: string) => setTitle((current) => (current.trim() === "" ? name.slice(0, MAX_TITLE) : current))

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (body) add.mutate(body)
      }}
    >
      <h4 className="text-sm font-medium">{heading}</h4>
      <div role="group" aria-label={t("add.kind")} className="flex flex-wrap gap-2">
        {KINDS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={kind === value ? "default" : "outline"}
            aria-pressed={kind === value}
            className="min-h-11 md:min-h-8"
            onClick={() => {
              setKind(value)
              add.reset()
            }}
          >
            {kinds[value]}
          </Button>
        ))}
      </div>
      {kind === "file" ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 self-start md:min-h-8"
            onClick={() => setDrive(true)}
          >
            {t("add.chooseFile")}
          </Button>
          {file ? <p className="text-sm break-words">{t("add.fileChosen", { name: file.name })}</p> : null}
          <DrivePicker
            open={drive}
            onOpenChange={setDrive}
            uploadPurpose="link"
            onSelect={(files) => {
              const picked = files[0]
              if (picked) {
                setFile({ id: picked.id, name: picked.name })
                suggest(picked.name)
              }
              setDrive(false)
            }}
          />
        </div>
      ) : null}
      {kind === "link" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${ids}-url`}>{t("add.urlLabel")}</Label>
          <Input
            id={`${ids}-url`}
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            className="min-h-11 md:min-h-8"
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
      ) : null}
      {kind === "library_item" ? (
        <div className="flex flex-col gap-2">
          <BookSearch
            onPick={(picked) => {
              setBook(picked)
              suggest(picked.title)
            }}
          />
          {book ? <p className="text-sm break-words">{t("add.bookChosen", { title: book.title })}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${ids}-title`}>{t("add.titleLabel")}</Label>
        <Input
          id={`${ids}-title`}
          value={title}
          maxLength={MAX_TITLE}
          className="min-h-11 md:min-h-8"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <Button type="submit" className="min-h-11 md:min-h-8" disabled={body === null || add.isPending}>
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
