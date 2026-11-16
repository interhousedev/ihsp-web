import type { IconName } from "./icon-name"

/** Where a milestone's completion comes from: a readiness component (score 0..100) or the preferences quiz. */
export type MilestoneSource = { kind: "readiness"; component: string } | { kind: "preferences" }

export type MilestoneConfig = {
  /** Stable id; the messages are `journey.milestones.<key>.{title,hint}`. */
  key: string
  source: MilestoneSource
  href: string
  icon: IconName
}

export type ActConfig = {
  /** Stable id; the messages are `journey.acts.<key>.{title,summary}`. */
  key: string
  milestones: readonly MilestoneConfig[]
}

const readiness = (component: string): MilestoneSource => ({ kind: "readiness", component })

/** The journey structure. Progress is derived from the API data only (see `derive.ts`). */
export const JOURNEY: readonly ActConfig[] = [
  {
    key: "decide",
    milestones: [
      { key: "preferences", source: { kind: "preferences" }, href: "/colleges/algorithm", icon: "sparkles" },
      { key: "major", source: readiness("major"), href: "/setup/", icon: "search" },
      { key: "countries", source: readiness("countries"), href: "/setup/", icon: "globe" },
      { key: "list", source: readiness("list"), href: "/chooser/", icon: "kanban" },
    ],
  },
  {
    key: "profile",
    milestones: [
      { key: "activities", source: readiness("activities"), href: "/activities/", icon: "sparkles" },
      { key: "tests", source: readiness("tests"), href: "/tests/", icon: "exams" },
      { key: "plans", source: readiness("plans"), href: "/plan/", icon: "calendar" },
    ],
  },
  {
    key: "apply",
    milestones: [
      { key: "essays", source: readiness("essays"), href: "/essays/", icon: "post" },
      { key: "documents", source: readiness("documents"), href: "/documents/", icon: "files" },
      { key: "tasks", source: readiness("tasks"), href: "/tasks/", icon: "check" },
    ],
  },
]
