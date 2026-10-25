import type { LessonSourceItem } from "@ihsp/api"
import { filePdf } from "./files"
import { ids, uuid } from "./world"

/** Ids of the lesson sources of Mathematics (kinds 74 and 75 of `uuid`). */
export const lessonSourceIds = {
  emisUrl: uuid(74, 1),
  emisFile: uuid(74, 2),
  emisUrlOld: uuid(74, 3),
  userUrl: uuid(74, 4),
  otherGroupUrl: uuid(74, 5),
}

function source(
  n: number,
  group: { id: string; name: string },
  date: string,
  title: string,
  extra: Partial<LessonSourceItem> = {},
): LessonSourceItem {
  return {
    link_id: uuid(74, n),
    lesson_id: uuid(75, n),
    group_id: group.id,
    group_name: group.name,
    date,
    title: `${date.slice(8, 10)}.${date.slice(5, 7)} ${title}`,
    name: title,
    kind: "url",
    short_url: `https://iht.uz/s/lesson${n}`,
    target_url: `https://example.org/lesson-${n}`,
    file: null,
    hidden: false,
    hidden_by_rule: false,
    source: "emis",
    ...extra,
  }
}

const group2TN2 = { id: ids.group2TN2, name: "2TN2" }
const group1TN1 = { id: ids.group1TN1, name: "1TN1" }

/** Lesson materials of Mathematics, by group name then newest lesson first (the backend's order). */
export const lessonSources: LessonSourceItem[] = [
  source(5, group1TN1, "2026-10-02", "Quadratics video"),
  source(1, group2TN2, "2026-10-06", "Derivatives slides"),
  source(2, group2TN2, "2026-10-05", "Limits worksheet", {
    kind: "file",
    short_url: "https://iht.uz/s/lesson2",
    target_url: null,
    file: filePdf,
  }),
  source(4, group2TN2, "2026-10-04", "Student notes", { source: "user" }),
  source(3, group2TN2, "2026-09-29", "Functions recap"),
]

/** The subject whose lessons carry the sources above. */
export const lessonSourcesSubjectId = ids.math
