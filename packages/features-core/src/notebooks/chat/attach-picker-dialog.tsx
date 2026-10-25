"use client"

import { getMeSubjectQuery, type ResourceItem, type SubjectDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, StateView } from "@ihsp/ui"
import { IconBook, IconSchool } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import type { AttachedItem } from "./chat-attachments"

export type PickerMode = "lesson" | "material"

type Row = { key: string; label: string; meta: string; item: AttachedItem }

type SubjectLesson = SubjectDetail["lessons"][number]

/** Lessons nearest to today first: recent and upcoming before the old ones. */
function byNearness(today: number) {
  return (a: SubjectLesson, b: SubjectLesson) =>
    Math.abs(Date.parse(a.date) - today) - Math.abs(Date.parse(b.date) - today)
}

function useRows(detail: SubjectDetail | undefined, mode: PickerMode, today: number): Row[] {
  const f = useFormatters()
  const t = useT("notebooks")
  if (!detail) return []
  const dateOf = (date: string) => f.date(date, { day: "numeric", month: "long" })
  if (mode === "lesson") {
    return detail.lessons.toSorted(byNearness(today)).map((lesson) => {
      const label = `${dateOf(lesson.date)} · ${lesson.topic ?? t("attach.noTopic")}`
      return {
        key: `lesson:${lesson.id}`,
        label,
        meta: detail.subject.name,
        item: { kind: "lesson", key: `lesson:${lesson.id}`, label, attachment: { kind: "lesson", id: lesson.id } },
      }
    })
  }
  const lessons = new Map(detail.lessons.map((lesson) => [lesson.id, lesson]))
  return detail.materials
    .filter((resource: ResourceItem) => !resource.hidden && resource.role !== "homework")
    .map((resource) => {
      const lesson = lessons.get(resource.lesson_id)
      return {
        key: `material:${resource.link_id}`,
        label: resource.title,
        meta: lesson ? `${dateOf(lesson.date)}${lesson.topic ? ` · ${lesson.topic}` : ""}` : "",
        item: {
          kind: "material",
          key: `material:${resource.link_id}`,
          label: resource.title,
          attachment: { kind: "material", id: resource.link_id, lesson_id: resource.lesson_id },
        },
      }
    })
}

type AttachPickerDialogProps = {
  subjectId: string
  mode: PickerMode | null
  onOpenChange: (open: boolean) => void
  onPick: (item: AttachedItem) => void
}

/** "Add lesson" and "Search materials" of the composer's (+) menu: the subject's lessons or materials with search. */
export function AttachPickerDialog({ subjectId, mode, onOpenChange, onPick }: AttachPickerDialogProps) {
  const t = useT("notebooks")
  const [search, setSearch] = useState("")
  const detail = useQuery({ ...getMeSubjectQuery(subjectId), enabled: mode !== null })
  const [today] = useState(() => Date.now())
  const rows = useRows(detail.data, mode ?? "lesson", today)
  const needle = search.trim().toLowerCase()
  const shown = rows.filter((row) => needle === "" || `${row.label} ${row.meta}`.toLowerCase().includes(needle))
  const title = mode === "material" ? t("attach.materials") : t("attach.lesson")
  const Icon = mode === "material" ? IconBook : IconSchool

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open) setSearch("")
        onOpenChange(open)
      }}
    >
      <DialogContent className="flex max-h-[85dvh] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          type="search"
          value={search}
          aria-label={t("attach.search")}
          placeholder={t("attach.search")}
          className="h-11 md:h-8"
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {detail.isPending ? (
            <StateView state="loading" rows={3} />
          ) : detail.isError ? (
            <StateView state="error" error={detail.error} onRetry={() => void detail.refetch()} />
          ) : shown.length === 0 ? (
            <StateView state="empty" emptyText={t("attach.empty")} />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {shown.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    className="hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-start outline-hidden focus-visible:ring-2"
                    onClick={() => {
                      onPick(row.item)
                      setSearch("")
                      onOpenChange(false)
                    }}
                  >
                    <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{row.label}</span>
                      {row.meta ? <span className="text-muted-foreground truncate text-xs">{row.meta}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
