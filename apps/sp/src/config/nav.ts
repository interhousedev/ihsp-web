"use client"

import { useT } from "@ihsp/i18n"
import type { BottomNavItem, NavGroup } from "@ihsp/ui"
import { IconNotebook, IconUserCircle } from "@ihsp/ui"
import { useMemo } from "react"

/**
 * Sidebar groups and the phone bottom bar (WEB-2): Home, Academics, Study tools (pages by the study-tools task),
 * Inbox and Account. The calendar (`/timetable/`, titled Calendar) also holds the attendance. The Dashboard (`/`) is the
 * landing page; Today (`/today/`, the widgets) sits next to it. The bar has the Dashboard, Calendar, Grades and Homework;
 * "More" is added by the shell.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  return useMemo(() => {
    const dashboard = { title: t("dashboard"), url: "/", icon: "dashboard", match: "exact" } as const
    const today = { title: t("today"), url: "/today/", icon: "today" } as const
    const timetable = { title: t("timetable"), url: "/timetable/", icon: "calendar" } as const
    const grades = { title: t("grades"), url: "/grades/", icon: "grades" } as const
    const homework = { title: t("homework"), url: "/homework/", icon: "homework" } as const
    return {
      groups: [
        { label: t("groupHome"), items: [dashboard, today] },
        {
          label: t("groupAcademics"),
          items: [
            timetable,
            { title: t("subjects"), url: "/subjects/", icon: "subjects" },
            grades,
            homework,
            { title: t("exams"), url: "/exams/", icon: "calendarEvent" },
            { title: t("teachers"), url: "/teachers/", icon: IconUserCircle },
          ],
        },
        {
          label: t("groupStudyTools"),
          items: [
            { title: t("assistant"), url: "/assistant/", icon: "assistant" },
            { title: t("notebooks"), url: "/notebooks/", icon: IconNotebook },
            { title: t("flashcards"), url: "/flashcards/", icon: "flashcards" },
            { title: t("files"), url: "/files/", icon: "files" },
            { title: t("links"), url: "/links/", icon: "links" },
          ],
        },
        {
          label: t("groupInbox"),
          items: [
            { title: t("notifications"), url: "/notifications/", icon: "notification" },
            { title: t("mail"), url: "/mail/", icon: "mail" },
          ],
        },
        {
          label: t("groupAccount"),
          items: [{ title: t("settings"), url: "/settings/", icon: "settings" }],
        },
      ],
      bottom: [dashboard, timetable, grades, homework],
    }
  }, [t])
}
