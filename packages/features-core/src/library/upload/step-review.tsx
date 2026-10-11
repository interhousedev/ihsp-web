"use client"

import { getLibrarySubjectsQuery, type ItemFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, formatBytes } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useLibraryAccess } from "../hooks/use-library-access"
import { effectiveLicence, type MaterialValues } from "./material-values"

/** The sentence about what happens after Submit: published at once, or reviewed by a librarian. */
export function SubmitNote({ className }: { className?: string }) {
  const t = useT("library.material.upload")
  const { publishesDirectly, isLibrarian } = useLibraryAccess()
  const note = publishesDirectly ? "teacherNote" : isLibrarian ? "librarianNote" : "studentNote"
  return (
    <p className={className} data-testid="submit-note">
      {t(note)}
    </p>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  )
}

/** Step 5: everything the user entered, and what Submit does for their role. */
export function StepReview({
  values,
  canPublish,
  existingFile,
}: {
  values: MaterialValues
  canPublish: boolean
  existingFile?: ItemFile | null
}) {
  const t = useT("library.upload.review")
  const library = useT("library")
  const licences = useT("library.upload.licence")
  const subjects = useQuery(getLibrarySubjectsQuery({ all: true }))
  const nameOf = (id: string) => subjects.data?.find((subject) => subject.id === id)?.name ?? id
  const licence = effectiveLicence(values, canPublish)

  let content: string
  if (values.kind === "markdown") content = t("markdownContent", { count: values.body.length })
  else if (values.kind === "photos" && values.photos.length > 0)
    content = t("photosContent", { count: values.photos.length })
  else if (values.kind === "pdf" && values.pdf)
    content = `${values.pdf.name} (${formatBytes(values.pdf.size)})`
  else if (existingFile) content = t("keptContent", { size: formatBytes(existingFile.byte_size) })
  else content = "–"

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 rounded-xl border p-4">
        <Row label={t("kind")}>{values.kind ? t(`kindName.${values.kind}`) : "–"}</Row>
        <Row label={t("title")}>
          <span className="font-medium">{values.title}</span>
        </Row>
        {values.description.trim() ? <Row label={t("description")}>{values.description}</Row> : null}
        <Row label={t("subjects")}>{values.subjectIds.map(nameOf).join(", ") || "–"}</Row>
        <Row label={t("years")}>{values.years.toSorted((a, b) => a - b).join(", ") || "–"}</Row>
        <Row label={t("type")}>{library(`type.${values.type}`)}</Row>
        <Row label={t("language")}>{library(`browse.language.${values.language}`)}</Row>
        <Row label={t("content")}>{content}</Row>
        <Row label={t("visibility")}>
          <Badge variant="secondary">
            {licence === "all_rights_reserved"
              ? t("lyceumOnly")
              : t("publicWith", { licence: licences(`name.${licence}`) })}
          </Badge>
        </Row>
      </dl>
      <SubmitNote className="bg-muted/40 rounded-xl border p-3 text-sm font-medium" />
    </div>
  )
}
