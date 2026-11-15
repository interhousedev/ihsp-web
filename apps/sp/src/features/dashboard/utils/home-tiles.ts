import type { IconName } from "@ihsp/ui"
import { IconUserCircle } from "@ihsp/ui"

export type HomeTile = {
  /** Key under `home.tiles`. */
  key: string
  href: string
  icon: IconName | typeof IconUserCircle
  /** Only the head student sees it. */
  headOnly?: boolean
}

/** The pages of this app the home grid links to (every one exists as a route of `apps/sp`). */
export const HOME_TILES: readonly HomeTile[] = [
  { key: "timetable", href: "/timetable/", icon: "timetable" },
  { key: "subjects", href: "/subjects/", icon: "subjects" },
  { key: "grades", href: "/grades/", icon: "grades" },
  { key: "homework", href: "/homework/", icon: "homework" },
  { key: "exams", href: "/exams/", icon: "exams" },
  { key: "excuses", href: "/excuses/", icon: "checks" },
  { key: "certificates", href: "/profile/#certificates-title", icon: "badgeCheck" },
  { key: "teachers", href: "/teachers/", icon: IconUserCircle },
  { key: "myGroup", href: "/my-group/", icon: "groups", headOnly: true },
  { key: "notebooks", href: "/notebooks/", icon: "notebooks" },
  { key: "flashcards", href: "/flashcards/", icon: "flashcards" },
  { key: "files", href: "/files/", icon: "files" },
]
