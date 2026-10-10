import type { MyTeacher, TeacherContacts, TeacherLesson } from "@ihsp/api"
import { todayIso } from "@ihsp/i18n"

export const TEACHERS_HREF = "/teachers/"
export const teacherHref = (id: string) => `/teachers/view/?id=${encodeURIComponent(id)}`

export function teacherName(teacher: Pick<MyTeacher, "first_name" | "last_name" | "middle_name">): string {
  return [teacher.last_name, teacher.first_name, teacher.middle_name].filter(Boolean).join(" ")
}

export type ContactChip = {
  kind: "telegram" | "email" | "phone" | "office" | "hours"
  /** What the chip shows. */
  value: string
  /** Opens in the Telegram, mail or phone app; chips without it copy `value` on tap. */
  href: string | null
}

/** The chips of the contacts that are set, in a fixed order: Telegram, phone, email, office, office hours. */
export function contactChips(contacts: TeacherContacts): ContactChip[] {
  const chips: ContactChip[] = []
  if (contacts.telegram)
    chips.push({ kind: "telegram", value: `@${contacts.telegram}`, href: `https://t.me/${contacts.telegram}` })
  if (contacts.phone)
    chips.push({ kind: "phone", value: contacts.phone, href: `tel:${contacts.phone.replace(/[^\d+]/g, "")}` })
  if (contacts.email) chips.push({ kind: "email", value: contacts.email, href: `mailto:${contacts.email}` })
  if (contacts.office) chips.push({ kind: "office", value: contacts.office, href: null })
  if (contacts.office_hours) chips.push({ kind: "hours", value: contacts.office_hours, href: null })
  return chips
}

export type TeacherStatus =
  | { kind: "now"; room: string | null }
  | { kind: "next"; startsAt: string; room: string | null; today: boolean }
  | { kind: "none" }

/** "Now" while a lesson runs; the next lesson when it is today or later; otherwise nothing is left today. */
export function teacherStatus(
  teacher: Pick<MyTeacher, "teaching_now" | "current" | "next">,
  now: Date = new Date(),
): TeacherStatus {
  if (teacher.teaching_now && teacher.current) return { kind: "now", room: teacher.current.room }
  if (!teacher.next) return { kind: "none" }
  return {
    kind: "next",
    startsAt: teacher.next.starts_at,
    room: teacher.next.room,
    today: teacher.next.date === todayIso(now),
  }
}

/** The week's lessons grouped by ISO weekday (1 to 7). */
export function lessonsByWeekday(week: TeacherLesson[]): Map<number, TeacherLesson[]> {
  const days = new Map<number, TeacherLesson[]>()
  for (const lesson of week) days.set(lesson.weekday, [...(days.get(lesson.weekday) ?? []), lesson])
  return days
}
