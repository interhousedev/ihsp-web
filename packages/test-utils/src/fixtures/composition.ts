import type { AdminDashboard, Alert, GroupStat, SearchResults, Student360, TeacherProfile } from "@ihsp/api"
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
}

export const emptySearchResults: SearchResults = {
  subjects: [],
  lessons: [],
  homework: [],
  files: [],
  flashcard_sets: [],
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
