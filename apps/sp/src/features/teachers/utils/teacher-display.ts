import type { MyTeacher, TeacherContacts, TeacherLesson } from "@ihsp/api"

export const TEACHERS_HREF = "/teachers/"
export const teacherHref = (id: string) => `/teachers/view/?id=${encodeURIComponent(id)}`
/** A subject's page (Overview). */
export const subjectHref = (id: string) => `/subjects/view/?id=${encodeURIComponent(id)}`
/** A subject's page on its Lessons tab, where the teacher's classes are listed. */
export const subjectLessonsHref = (id: string) => `/subjects/view/?id=${encodeURIComponent(id)}&tab=lessons`

/** A lesson's page. */
export const lessonHref = (id: string) => `/lessons/view/?id=${encodeURIComponent(id)}`
/** Where a teacher's class leads: its lesson page when it is a stored lesson, else the subject's Lessons tab. */
export const classHref = (lesson: Pick<TeacherLesson, "lesson_id" | "subject_id">) =>
  lesson.lesson_id ? lessonHref(lesson.lesson_id) : subjectLessonsHref(lesson.subject_id)

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

/** The class to show first: the one running now, otherwise the next one, otherwise the first of the next two weeks. */
export function nearestLesson(teacher: Pick<MyTeacher, "current" | "next" | "upcoming">): TeacherLesson | null {
  return teacher.current ?? teacher.next ?? teacher.upcoming[0] ?? null
}
