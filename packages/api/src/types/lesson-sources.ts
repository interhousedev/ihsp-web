// Lesson materials seen per group: the "From lessons (EMIS)" lists of the subject pages.

import type { FileItem } from "./files"

/** A material of a lesson, seen from one of the lesson's groups. */
export type LessonSourceItem = {
  link_id: string
  lesson_id: string
  group_id: string
  group_name: string
  /** `YYYY-MM-DD`. */
  date: string
  /** `DD.MM name`. */
  title: string
  name: string
  kind: "url" | "file"
  short_url: string
  target_url: string | null
  file: FileItem | null
  /** Hidden by the teacher for this one resource, or by the group rule. */
  hidden: boolean
  hidden_by_rule: boolean
  source: "user" | "emis"
}

/** A page of lesson sources, by group name then newest lesson first. */
export type LessonSourcePage = {
  items: LessonSourceItem[]
  total: number
  limit: number
  offset: number
}

export type LessonSourcesParams = {
  group_id?: string
  /** `emis` (default) lists EMIS materials only; `all` adds the ones people added. */
  origin?: "emis" | "all"
  /** 1..200, default 50. */
  limit?: number
  offset?: number
}

export type EmisSourcesHiddenBody = { hidden: boolean }

/** `affected` counts the resources a PUT changed. */
export type EmisSourcesHidden = { hidden: boolean; affected: number }
