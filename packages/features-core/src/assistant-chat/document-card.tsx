"use client"

import {
  getStaffTodayQuery,
  postLessonResources,
  resolveFileUrl,
  type DocumentCard as Document,
  type LessonItem,
} from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ihsp/ui"
import { IconDownload, IconFileTypeDoc, IconLink } from "@tabler/icons-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

type DocumentCardProps = { document: Document }

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function lessonLabel(lesson: LessonItem): string {
  return `${lesson.starts_at.slice(11, 16)} ${lesson.subject.name}`
}

/** "Прикрепить к уроку": a teacher picks one of today's lessons and the file becomes its material. */
function AttachMenu({ fileId }: { fileId: string }) {
  const t = useT("notebooks")
  const lessons = useQuery(getStaffTodayQuery())
  const attach = useMutation({
    mutationFn: (lessonId: string) =>
      postLessonResources(lessonId, { role: "material", kind: "file", file_id: fileId }),
    onSuccess: () => toast.success(t("documents.attached")),
    onError: () => toast.error(t("documents.attachFailed")),
  })
  const items = lessons.data?.lessons ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-8" />}
      >
        <IconLink aria-hidden />
        {t("documents.attach")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">{t("documents.noLessons")}</p>
        ) : (
          items.map((lesson) => (
            <DropdownMenuItem
              key={lesson.id}
              className="min-h-11 md:min-h-8"
              disabled={attach.isPending}
              onClick={() => attach.mutate(lesson.id)}
            >
              {lessonLabel(lesson)}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A document made by the assistant: file name, size, a download and (for staff) "Attach to a lesson". */
export function DocumentCard({ document: doc }: DocumentCardProps) {
  const t = useT("notebooks")
  const { session } = useSession()
  const isStaff = session?.user.roles.includes("teacher") ?? false

  async function download() {
    try {
      window.open(await resolveFileUrl(doc.file_id, false), "_blank", "noopener,noreferrer")
    } catch {
      toast.error(t("documents.downloadFailed"))
    }
  }

  return (
    <div
      data-document-card={doc.kind}
      className="bg-card flex w-full max-w-md flex-col gap-2 rounded-lg border p-3"
      role="group"
      aria-label={doc.name}
    >
      <div className="flex min-w-0 items-center gap-3">
        <IconFileTypeDoc className="text-primary size-8 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <p className="text-muted-foreground text-xs">
            .{doc.kind} · {sizeLabel(doc.size)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className="min-h-11 md:min-h-8" onClick={() => void download()}>
          <IconDownload aria-hidden />
          {t("documents.download", { format: doc.kind })}
        </Button>
        {isStaff ? <AttachMenu fileId={doc.file_id} /> : null}
      </div>
    </div>
  )
}
