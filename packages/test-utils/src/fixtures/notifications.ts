import type { NotificationItem } from "@ihsp/api"
import { ids } from "./world"

/** Newest first. Types starting with `broadcast.` are announcements, everything else is activity. */
export const notificationItems: NotificationItem[] = [
  {
    id: "0000000c-0000-4000-8000-000000000001",
    type: "marks.new",
    title: "New marks",
    body: "Mathematics: 5, Chemistry: 3, English: 4",
    link: "/grades/?tab=day",
    created_at: "2026-10-06T14:30:00Z",
    read_at: null,
  },
  {
    id: "0000000c-0000-4000-8000-000000000002",
    type: "broadcast.announcement",
    title: "Autumn break schedule",
    body: "Classes are cancelled on 1 October. The timetable of 31 October follows Monday.",
    link: null,
    created_at: "2026-10-05T09:00:00Z",
    read_at: null,
  },
  {
    id: "0000000c-0000-4000-8000-000000000003",
    type: "homework.assigned",
    title: "Homework: Physics",
    body: "Solve problems 14-17 on page 52 (due 9 October)",
    link: `/lessons/view/?id=${ids.lessonPhysicsToday}`,
    created_at: "2026-10-07T04:10:00Z",
    read_at: null,
  },
  {
    id: "0000000c-0000-4000-8000-000000000004",
    type: "lesson.changed",
    title: "Lesson moved",
    body: "Informatics on Friday moved to room Klaster",
    link: "/timetable/",
    created_at: "2026-10-04T16:00:00Z",
    read_at: "2026-10-04T17:00:00Z",
  },
  {
    id: "0000000c-0000-4000-8000-000000000005",
    type: "files.expiring",
    title: "Files will be deleted",
    body: "2 files will be deleted on 15 January 2027",
    link: "/files/",
    created_at: "2026-10-03T08:00:00Z",
    read_at: "2026-10-03T09:00:00Z",
  },
  {
    id: "0000000c-0000-4000-8000-000000000006",
    type: "broadcast.announcement",
    title: "Welcome to the new semester",
    body: "The student portal now shows your timetable, grades and homework in one place.",
    link: null,
    created_at: "2026-09-02T05:00:00Z",
    read_at: "2026-09-02T07:00:00Z",
  },
]

export function isAnnouncement(item: NotificationItem): boolean {
  return item.type.startsWith("broadcast.")
}

export const unreadCount = { count: notificationItems.filter((item) => item.read_at === null).length }
