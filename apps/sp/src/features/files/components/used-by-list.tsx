"use client"

import { getMeLessonQuery, type UsedBy } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

/** A lesson that uses the file: its subject and date, linking to the lesson (the label from the API is a raw id). */
function LessonUse({ id, fallback }: { id: string; fallback: string }) {
  const t = useT("files.usedBy")
  const f = useFormatters()
  const lesson = useQuery(getMeLessonQuery(id)).data?.lesson
  const text = lesson
    ? `${lesson.subject.name}, ${f.date(lesson.starts_at, { day: "numeric", month: "long" })}`
    : fallback
  return (
    <Link href={`/lessons/view/?id=${encodeURIComponent(id)}`} className="truncate hover:underline">
      {t("lesson")}: {text}
    </Link>
  )
}

/** Where a file is used: links, lessons, chats. */
export function UsedByList({ items }: { items: UsedBy[] }) {
  const t = useT("files.usedBy")
  if (items.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label={t("label")}>
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}`}>
          <Badge variant="outline" className="max-w-full">
            {item.kind === "lesson" ? (
              <LessonUse id={item.id} fallback={/\s/.test(item.label) ? item.label : t("lessonUnknown")} />
            ) : (
              <span className="truncate">
                {t(item.kind)}: {item.label}
              </span>
            )}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
