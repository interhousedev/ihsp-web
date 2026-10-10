"use client"

import { useT } from "@ihsp/i18n"
import type { BottomNavItem, NavGroup } from "@ihsp/ui"
import { IconNotebook } from "@ihsp/ui"
import { useMemo } from "react"

/**
 * Sidebar groups and the phone bottom bar (WEB-2): Home, Academics, Study tools (pages by the study-tools task),
 * Inbox and Account. The bar has Today, Timetable, Grades and Homework; "More" is added by the shell.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  return useMemo(() => {
    const today = { title: t("today"), url: "/", icon: "today", match: "exact" } as const
    const timetable = { title: t("timetable"), url: "/timetable/", icon: "timetable" } as const
    const grades = { title: t("grades"), url: "/grades/", icon: "grades" } as const
    const homework = { title: t("homework"), url: "/homework/", icon: "homework" } as const
    return {
      groups: [
        { label: t("groupHome"), items: [today] },
        {
          label: t("groupAcademics"),
          items: [
            timetable,
            { title: t("subjects"), url: "/subjects/", icon: "subjects" },
            grades,
            { title: t("attendance"), url: "/attendance/", icon: "attendance" },
            homework,
            { title: t("exams"), url: "/exams/", icon: "calendarEvent" },
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
          items: [{ title: t("notifications"), url: "/notifications/", icon: "notification" }],
        },
        {
          label: t("groupAccount"),
          items: [
            { title: t("profile"), url: "/profile/", icon: "profile" },
            { title: t("settings"), url: "/settings/", icon: "settings" },
          ],
        },
      ],
      bottom: [today, timetable, grades, homework],
    }
  }, [t])
}
