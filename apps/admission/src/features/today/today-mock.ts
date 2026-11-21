/**
 * MOCK ADAPTER for the "Сегодня" home. The next-action engine, the season, the streak and the fit scores have no
 * endpoint yet (see the student-flow notes); every number below is invented demo data. `useTodayData` is the one
 * place that will call the real feed.
 */
import type { Line } from "../fit/fit-model"
import { buildFit, MOCK_UNIS, type Missing, type MockUni, type MockUniId } from "../fit/mock-fit"
import type { UniFit } from "../fit/fit-model"

export const TODAY_STATES = ["g10-autumn", "g11-november", "g11-march"] as const
export type TodayStateId = (typeof TODAY_STATES)[number]
export const SEASONS = ["explore", "build", "choose", "write", "submit", "results"] as const
export type SeasonId = (typeof SEASONS)[number]

export type NextAction = {
  id: string
  /** `today.action.<id>.title|why|cta`. */
  params?: Record<string, string | number>
  minutes: number
  href: string
}
export type Check = { id: string; done: boolean; progress?: string }
export type UniStatus = "draft" | "pending" | "admitted" | "waitlist" | "rejected"
export type UniRowData = {
  uni: MockUni
  fit: UniFit
  status: UniStatus
  round: "ED" | "EA" | "RD" | null
  deadline: string | null
  tasks: { done: number; total: number } | null
}
export type DeadlineItem = { id: string; kind: "apply" | "test" | "meeting" | "reply" | "doc"; date: string; name?: string }
export type Profession = { id: "data" | "biomed" | "translator"; risk: "low" | "mid" | "high" }

export type TodayData = {
  id: TodayStateId
  /** The mock "today", so the demo does not drift with the clock. */
  today: string
  grade: 10 | 11
  season: SeasonId
  actions: NextAction[]
  streak: { days: number; week: boolean[] }
  checks: Check[]
  readiness: number
  unis: UniRowData[]
  professions: Profession[]
  deadlines: DeadlineItem[]
}

const row = (id: MockUniId, missing: Missing, extra: Omit<UniRowData, "uni" | "fit">): UniRowData => {
  const uni = MOCK_UNIS.find((u) => u.id === id)!
  return { uni, fit: buildFit(uni.raw, missing), ...extra }
}

export const TODAY_DATA: Record<TodayStateId, TodayData> = {
  "g10-autumn": {
    id: "g10-autumn",
    today: "2026-10-12",
    grade: 10,
    season: "explore",
    actions: [
      { id: "quiz", minutes: 5, href: "/career/?tab=explore" },
      { id: "professions", minutes: 15, href: "/career/?tab=future" },
      { id: "ieltsTrial", minutes: 5, href: "/tests/" },
    ],
    streak: { days: 2, week: [false, false, false, false, false, true, true] },
    checks: [
      { id: "quiz", done: false },
      { id: "activities", done: false, progress: "1/3" },
      { id: "testBooked", done: false },
      { id: "field", done: false },
    ],
    readiness: 14,
    unis: [],
    professions: [
      { id: "data", risk: "low" },
      { id: "biomed", risk: "low" },
      { id: "translator", risk: "high" },
    ],
    deadlines: [
      { id: "meet", kind: "meeting", date: "2026-10-18" },
      { id: "ielts", kind: "test", date: "2026-11-05" },
    ],
  },
  "g11-november": {
    id: "g11-november",
    today: "2026-11-21",
    grade: 11,
    season: "submit",
    actions: [
      { id: "essays", params: { name: "Stanford", n: 3 }, minutes: 40, href: "/essays/" },
      { id: "transcript", params: { n: 5 }, minutes: 5, href: "/documents/" },
      { id: "direction", params: { n: 6 }, minutes: 15, href: "/career/?tab=field" },
    ],
    streak: { days: 12, week: [true, true, true, true, false, true, false] },
    checks: [
      { id: "safety", done: true },
      { id: "personalEssay", done: false, progress: "70%" },
      { id: "transcript", done: false },
      { id: "submitted", done: false, progress: "1/6" },
    ],
    readiness: 47,
    unis: [
      row("stanford", { goals: true }, { status: "draft", round: "RD", deadline: "2026-12-05", tasks: { done: 1, total: 7 } }),
      row("columbia", { goals: true }, { status: "draft", round: "RD", deadline: "2027-01-01", tasks: { done: 0, total: 7 } }),
      row("koc", { goals: true, traits: true }, { status: "draft", round: "EA", deadline: "2027-01-15", tasks: { done: 2, total: 5 } }),
      row("bocconi", { goals: true }, { status: "draft", round: "RD", deadline: "2027-01-20", tasks: { done: 0, total: 6 } }),
      row("yale", { goals: true, traits: true }, { status: "draft", round: "RD", deadline: "2027-01-02", tasks: { done: 0, total: 7 } }),
      row("wiut", { goals: true }, { status: "pending", round: null, deadline: "2027-06-15", tasks: { done: 5, total: 5 } }),
    ],
    professions: [],
    deadlines: [
      { id: "stanford", kind: "apply", date: "2026-12-05", name: "Stanford" },
      { id: "ielts", kind: "test", date: "2026-12-12" },
      { id: "columbia", kind: "apply", date: "2027-01-01", name: "Columbia" },
      { id: "yale", kind: "apply", date: "2027-01-02", name: "Yale" },
      { id: "koc", kind: "apply", date: "2027-01-15", name: "Koç" },
    ],
  },
  "g11-march": {
    id: "g11-march",
    today: "2027-03-14",
    grade: 11,
    season: "results",
    actions: [
      { id: "compare", params: { a: "Koç", b: "Bocconi" }, minutes: 10, href: "/outcomes/" },
      { id: "taxDoc", params: { name: "Bocconi" }, minutes: 20, href: "/documents/" },
      { id: "thanks", minutes: 5, href: "/essays/" },
    ],
    streak: { days: 31, week: [true, true, true, true, true, true, false] },
    checks: [
      { id: "allSent", done: true },
      { id: "resultsIn", done: false, progress: "5/6" },
      { id: "decision", done: false },
      { id: "reply", done: false },
    ],
    readiness: 88,
    unis: [
      row("koc", {}, { status: "admitted", round: "EA", deadline: "2027-05-01", tasks: null }),
      row("bocconi", {}, { status: "admitted", round: "RD", deadline: "2027-05-01", tasks: null }),
      row("columbia", {}, { status: "waitlist", round: "RD", deadline: null, tasks: null }),
      row("wiut", {}, { status: "admitted", round: null, deadline: "2027-06-15", tasks: null }),
      row("stanford", {}, { status: "rejected", round: "RD", deadline: null, tasks: null }),
      row("yale", {}, { status: "pending", round: "RD", deadline: null, tasks: null }),
    ],
    professions: [],
    deadlines: [
      { id: "taxDoc", kind: "doc", date: "2027-03-25", name: "Bocconi" },
      { id: "deposit", kind: "reply", date: "2027-04-15", name: "Koç" },
      { id: "reply", kind: "reply", date: "2027-05-01" },
    ],
  },
}

/** The deadline line key and its placeholders. */
export function deadlineLine(item: DeadlineItem): Line {
  return { key: item.kind, params: item.name ? { name: item.name } : undefined }
}

