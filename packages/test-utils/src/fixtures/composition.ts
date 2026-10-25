import type { AdminDashboard, Alert, GroupStat, Insights, SearchResults, Student360, TeacherProfile } from "@ihsp/api"
import { homeworkPhysics, staffToday, studentAttendance } from "./classwork"
import { broadcastScheduled } from "./broadcasts"
import { filePdf } from "./files"
import { flashcardSetPhysics } from "./flashcards"
import { adminTeacherUser } from "./id-admin"
import { auditItems, sessionItems, telegramAccounts } from "./id"
import { semesterGrades, syncRuns } from "./marks"
import { group2TN2, studentProfile } from "./schedule"
import { ids, persons, subjectRefs, todayLessons, weekLessons } from "./world"

export const alerts: Alert[] = [
  { kind: "files_expiring", params: { count: 2, date: "2027-01-15" }, action_url: "/files/" },
  { kind: "pending_approvals", params: { count: 1 }, action_url: `/assistant/chat/?id=${ids.chat}` },
]

/** An alert of a student whose EMIS password stopped working. */
export const alertEmisReauth: Alert = {
  kind: "emis_reauth",
  params: {},
  action_url: "http://localhost:3001/security/emis/",
}

export const searchResults: SearchResults = {
  subjects: [subjectRefs.physics],
  lessons: weekLessons.filter((lesson) => lesson.subject.id === ids.physics),
  homework: [homeworkPhysics],
  files: [filePdf],
  flashcard_sets: [flashcardSetPhysics],
  notebooks: [
    {
      id: "00000000-0000-4000-8000-0000000000a1",
      title: "Physics 9",
      emoji: null,
      source_count: 2,
      matched_sources: ["Optics.pdf"],
    },
  ],
  marks: [{ subject: subjectRefs.physics, type: "current", value: 5, date: "2026-10-07", lesson_id: null }],
  library_items: [
    {
      id: "00000000-0000-4000-8000-0000000000b1",
      slug: "physics-textbook",
      title: "Physics textbook",
      author_label: "I. Savelyev",
      kind: "book",
    },
  ],
}

export const emptySearchResults: SearchResults = {
  subjects: [],
  lessons: [],
  homework: [],
  files: [],
  flashcard_sets: [],
  notebooks: [],
  marks: [],
  library_items: [],
}

export const calendarTokenResponse = { url: "http://localhost:8000/ical/cal-token-1.ics" }

export const adminDashboard: AdminDashboard = {
  today: { lessons: todayLessons.length, cancelled: 0, teacher_needed: 1 },
  missing_attendance: [{ teacher: persons.yusupov, count: 1 }],
  sync: { last_run: syncRuns[0] ?? null, needs_reauth: 1 },
  scheduled_broadcasts: [broadcastScheduled],
}

export const groupStats: GroupStat[] = [
  { group_id: ids.group2TN2, attendance_rate: 0.97, average_gpa: 4.1 },
  { group_id: ids.group1TN1, attendance_rate: 1, average_gpa: 0 },
]

/** Fourteen days ending 2026-10-10 (Tashkent): sign-ins and assistant tokens, with a quiet start. */
const insightDays = Array.from({ length: 14 }, (_, index) =>
  new Date(Date.UTC(2026, 8, 27 + index)).toISOString().slice(0, 10),
)

export const insights: Insights = {
  generated_at: "2026-10-10T08:00:00Z",
  system: { db: true, redis: true, queue_pending: 1, queue_lag: 3, logins_24h: 90, failed_logins_24h: 10 },
  usage: {
    sign_ins: insightDays.map((date, index) => ({ date, count: index === 13 ? 42 : index })),
    ai_tokens: insightDays.map((date, index) => ({ date, count: index === 13 ? 120_000 : index * 1000 })),
    storage: { bytes: 5_368_709_120, files: 321, by_scope: { student: 1_073_741_824, library: 4_294_967_296 } },
  },
  marks: { distribution: { "2": 3, "3": 10, "4": 25, "5": 40 } },
}

export const student360: Student360 = {
  profile: { ...studentProfile, status: "active", roles: ["student"] },
  timetable_week: weekLessons,
  grades: semesterGrades,
  attendance: studentAttendance,
  telegram: telegramAccounts,
  sessions: sessionItems,
  audit: auditItems,
}

export const teacherProfile: TeacherProfile = {
  user: adminTeacherUser,
  timetable_week: weekLessons.filter((lesson) => lesson.teacher?.id === ids.teacherKalandarova),
  missing_attendance: staffToday.needs_attention,
  curated_groups: [group2TN2],
}
