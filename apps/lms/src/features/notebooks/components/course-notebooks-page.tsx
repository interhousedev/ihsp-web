"use client"

import { isApiError, type NotebookItem } from "@ihsp/api"
import { useAllNotebooks } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, PageContainer, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { notebookHref } from "../utils/hrefs"

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
const FALLBACK_EMOJI = "📓"

function CourseNotebookCard({ notebook }: { notebook: NotebookItem }) {
  const t = useT("courseNotebooks")
  const format = useFormatters()
  const when = format.relative(notebook.last_opened_at ?? notebook.updated_at)
  return (
    <li>
      <Link
        href={notebookHref(notebook.id)}
        className="bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex h-full min-h-32 flex-col gap-3 rounded-xl p-4 ring-1 transition-colors outline-none focus-visible:ring-2"
      >
        <span aria-hidden className="text-4xl leading-none">
          {notebook.emoji ?? FALLBACK_EMOJI}
        </span>
        <span className="line-clamp-2 text-base leading-snug font-medium break-words">{notebook.title}</span>
        <span className="text-muted-foreground mt-auto text-xs">
          {t("meta", { sources: t("sources", { count: notebook.source_count }), when })}
        </span>
      </Link>
    </li>
  )
}

/**
 * `/notebooks/`: the student's notebooks of the LMS courses they are enrolled in (one per course, created on enrollment).
 * Other notebooks of the student are not listed here.
 */
export function CourseNotebooksPage() {
  const t = useT("courseNotebooks")
  const notebooks = useAllNotebooks()
  const courseNotebooks = useMemo(
    () => notebooks.items.filter((notebook) => notebook.origin === "course_student"),
    [notebooks.items],
  )
  // The API lists notebooks for students and teachers only; any other signed-in user (an admin) gets 403 and has none.
  const notAllowed = notebooks.isError && isApiError(notebooks.error) && notebooks.error.status === 403
  const showEmpty = (notebooks.isSuccess || notAllowed) && courseNotebooks.length === 0

  return (
    <PageContainer title={t("title")}>
      {notebooks.isPending ? (
        <ul className={GRID} aria-hidden>
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-32 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      ) : null}
      {notebooks.isError && !notAllowed ? (
        <StateView state="error" error={notebooks.error} onRetry={() => void notebooks.refetch()} />
      ) : null}
      {showEmpty ? <StateView state="empty" emptyText={t("empty")} /> : null}
      {courseNotebooks.length > 0 ? (
        <ul className={GRID}>
          {courseNotebooks.map((notebook) => (
            <CourseNotebookCard key={notebook.id} notebook={notebook} />
          ))}
        </ul>
      ) : null}
      {courseNotebooks.length > 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Icons.info aria-hidden className="size-3.5" />
          {t("hint")}
        </p>
      ) : null}
    </PageContainer>
  )
}
